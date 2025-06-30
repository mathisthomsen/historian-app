import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, verifyRefreshToken, generateAccessToken } from './auth'
import prisma from '../libs/prisma'

export async function getAuthenticatedUser(request: NextRequest): Promise<{ user: any; response?: NextResponse }> {
  try {
    // First try to get current user
    let user = await getCurrentUser(request)
    
    if (user) {
      return { user }
    }

    // If no user found, check if we have a refresh token
    const refreshTokenCookie = request.cookies.get('refreshToken')
    
    if (!refreshTokenCookie?.value) {
      return { user: null }
    }

    console.log('🔄 API Helper: Attempting token refresh')
    
    // Verify refresh token
    const payload = verifyRefreshToken(refreshTokenCookie.value)
    if (!payload) {
      console.log('🔄 API Helper: Invalid refresh token')
      return { user: null }
    }

    // Check if refresh token exists in database using raw query
    const storedToken = await prisma.$queryRaw`
      SELECT rt.id, rt.userId, rt.token, rt.expiresAt, 
             u.id as userId, u.email, u.name, u.role, u.emailVerified
      FROM refresh_tokens rt
      JOIN users u ON rt.userId = u.id
      WHERE rt.userId = ${payload.userId} 
        AND rt.token = ${payload.tokenId}
        AND rt.expiresAt > NOW()
      LIMIT 1
    ` as any[]

    if (!storedToken || storedToken.length === 0) {
      console.log('🔄 API Helper: Refresh token not found in database or expired')
      return { user: null }
    }

    const userData = storedToken[0]
    console.log('🔄 API Helper: Generating new access token')

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: userData.userId,
      email: userData.email,
      role: userData.role
    })

    // Create response with new access token
    const response = new NextResponse()
    
    // Set new access token cookie
    const isProduction = process.env.NODE_ENV === 'production'
    
    response.cookies.set('accessToken', newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/'
    })

    console.log('🔄 API Helper: New access token set successfully')

    return {
      user: {
        id: userData.userId,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        emailVerified: userData.emailVerified
      },
      response
    }

  } catch (error) {
    console.error('🔄 API Helper: Error refreshing token:', error)
    return { user: null }
  }
} 