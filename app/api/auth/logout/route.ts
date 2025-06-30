import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '../../../lib/api-helpers'

export async function POST(request: NextRequest) {
  const { user, response } = await getAuthenticatedUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Create response to clear cookies
  const logoutResponse = NextResponse.json({ success: true })
  
  // Clear authentication cookies
  logoutResponse.cookies.set('accessToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  })
  
  logoutResponse.cookies.set('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/'
  })

  // If we have a response with new cookies from token refresh, merge them
  if (response) {
    response.cookies.getAll().forEach(cookie => {
      logoutResponse.cookies.set(cookie.name, cookie.value, {
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        maxAge: cookie.maxAge,
        path: cookie.path
      })
    })
  }

  return logoutResponse
} 