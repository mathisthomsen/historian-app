import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, verifyRefreshToken } from './auth'
import prisma from '../libs/prisma'
import { generateAccessToken } from './auth'

export async function refreshAccessToken(req: NextRequest): Promise<NextResponse | null> {
  try {
    // Check if access token is missing but refresh token exists
    const accessTokenCookie = req.cookies.get('accessToken')
    const refreshTokenCookie = req.cookies.get('refreshToken')
    
    if (!accessTokenCookie?.value && refreshTokenCookie?.value) {
      console.log('🔄 Middleware: Access token missing, attempting refresh')
      
      // Verify refresh token
      const refreshPayload = verifyRefreshToken(refreshTokenCookie.value)
      if (!refreshPayload) {
        console.log('🔄 Middleware: Invalid refresh token')
        return null
      }

      // Check if refresh token exists in database
      const storedToken = await prisma.refreshToken.findFirst({
        where: {
          userId: refreshPayload.userId,
          token: refreshPayload.tokenId,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              emailVerified: true
            }
          }
        }
      })

      if (!storedToken) {
        console.log('🔄 Middleware: Refresh token not found in database or expired')
        return null
      }

      console.log('🔄 Middleware: Generating new access token')

      // Generate new access token
      const newAccessToken = generateAccessToken({
        userId: storedToken.user.id,
        email: storedToken.user.email,
        role: storedToken.user.role
      })

      // Create response with new access token
      const response = NextResponse.next()
      
      // Set new access token cookie
      const isProduction = process.env.NODE_ENV === 'production'
      
      response.cookies.set('accessToken', newAccessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 15 * 60, // 15 minutes
        path: '/'
      })

      console.log('🔄 Middleware: New access token set successfully')
      return response
    }

    return null
  } catch (error) {
    console.error('🔄 Middleware: Error refreshing token:', error)
    return null
  }
} 