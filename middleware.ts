import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Add your IP address here for production access control
const ALLOWED_IPS = [
  '127.0.0.1', // localhost
  '::1', // localhost IPv6
  '79.207.110.161', // Your IP address
  // Add more IP addresses here if needed
];

export function middleware(request: NextRequest) {
  // Only apply access control in production
  if (process.env.NODE_ENV === 'production') {
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Check if client IP is in allowed list
    const isAllowed = ALLOWED_IPS.some(allowedIP => 
      clientIP === allowedIP || clientIP.startsWith(allowedIP + ':')
    );
    
    if (!isAllowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Access denied' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 