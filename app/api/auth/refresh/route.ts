import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../libs/prisma'
import { 
  verifyRefreshToken, 
  generateAccessToken
} from '../../../lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookies
    const refreshTokenCookie = request.cookies.get('refreshToken')
    
    if (!refreshTokenCookie?.value) {
      return NextResponse.json({ error: 'No refresh token provided' }, { status: 401 })
    }

    console.log('🔄 Refresh endpoint: Attempting token refresh')
    
    // Verify refresh token
    const payload = verifyRefreshToken(refreshTokenCookie.value)
    
    if (!payload) {
      console.log('🔄 Refresh endpoint: Invalid refresh token')
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 })
    }

    // Check if refresh token exists in database
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
      console.log('🔄 Refresh endpoint: Refresh token not found in database or expired')
      return NextResponse.json({ error: 'Refresh token not found or expired' }, { status: 401 })
    }

    const userData = storedToken[0]
    console.log('🔄 Refresh endpoint: Generating new access token')

    // Generate new access token
    const newAccessToken = generateAccessToken({
      userId: userData.userId,
      email: userData.email,
      role: userData.role
    })

    // Create response with new access token
    const response = NextResponse.json({ 
      success: true,
      user: {
        id: userData.userId,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        emailVerified: userData.emailVerified
      }
    })
    
    // Set new access token cookie
    const isProduction = process.env.NODE_ENV === 'production'
    
    response.cookies.set('accessToken', newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/'
    })

    console.log('🔄 Refresh endpoint: New access token set successfully')

    return response

  } catch (error) {
    console.error('🔄 Refresh endpoint: Error refreshing token:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 