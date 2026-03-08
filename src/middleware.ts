import NextAuth from "next-auth";
import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { authConfig } from "./auth.config";
import { routing } from "./i18n/routing";

// Paths that must never be accessible regardless of environment.
const BLOCKED_PATHS = [/^\/api\/debug(\/|$)/, /^\/api\/test(\/|$)/];

// Use authConfig (edge-safe: no Prisma/bcrypt) for the middleware JWT check.
const { auth } = NextAuth(authConfig);
const intlMiddleware = createIntlMiddleware(routing);

export default auth(async function middleware(request: NextRequest) {
  // Block debug/test API paths before any other check.
  if (BLOCKED_PATHS.some((re) => re.test(request.nextUrl.pathname))) {
    return new NextResponse(null, { status: 404 });
  }

  // Skip intl middleware for API routes (no locale prefix on API paths)
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return;
  }
  return intlMiddleware(request);
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
