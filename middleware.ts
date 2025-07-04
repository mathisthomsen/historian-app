import { authkitMiddleware } from '@workos-inc/authkit-nextjs';

export default authkitMiddleware();

// Protect all routes except for public assets and API auth endpoints
export const config = {
  matcher: [
    // Protect all app routes
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 