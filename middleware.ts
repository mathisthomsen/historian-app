import { authkitMiddleware } from '@workos-inc/authkit-nextjs';

export default authkitMiddleware({
  redirectUri: process.env.AUTHKIT_REDIRECT_URI || process.env.WORKOS_REDIRECT_URI,
});

// Protect all routes except for public assets and API auth endpoints
export const config = {
  matcher: [
    // Protect all app routes
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 