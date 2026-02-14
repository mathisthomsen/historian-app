/**
 * Route protection: redirect unauthenticated users to /auth/login for app routes
 * that require a session. Uses NextAuth JWT (session strategy must be 'jwt').
 *
 * API routes are not protected here; they use requireUser() and return 401/500.
 * Public routes: /, /auth/*, /funktionen, /blog, /imprint, /privacy, /contact, etc.
 */
export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/events/:path*',
    '/persons/:path*',
    '/sources/:path*',
    '/statements/:path*',
    '/person-relations/:path*',
    '/person-event-relations/:path*',
    '/locations/:path*',
    '/locations-manage/:path*',
    '/timeline/:path*',
    '/analytics/:path*',
    '/activity/:path*',
    '/account/:path*',
    '/bibliography-sync/:path*',
    '/literature/:path*',
  ],
};
