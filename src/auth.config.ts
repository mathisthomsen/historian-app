import type { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";

import { isSessionRevoked } from "@/lib/session-revocation";

const PUBLIC_PATHS = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/verify",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/changelog",
  "/impressum",
  "/datenschutz",
  "/",
]);

export const authConfig: NextAuthConfig = {
  providers: [],
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        // Stamped only here, at sign-in — `user` is undefined on every other
        // call to this callback — and never touched again, so it survives
        // the unconditional re-encode below. See the `session` callback for
        // why revocation compares against this instead of `iat`.
        token.authTime = Math.floor(Date.now() / 1000);
        if (user.projectId) token.projectId = user.projectId;
      }
      return token;
    },
    async session({ session, token }) {
      const jwt = token as JWT;
      // Revocation compares against `authTime`, not `iat`. Measured against
      // the installed @auth/core: on the JWT strategy, `jwt.encode` re-signs
      // the token on *every* session read (not only at `updateAge`
      // rotation), and jose's `.setIssuedAt()` is called with no argument —
      // so `iat` is overwritten with `now` on every read. A revoked cookie
      // compared against `iat` would be refused once, come back with a
      // freshly stamped `iat` on that same response's Set-Cookie, and pass
      // on every request after that. `authTime` is set only when
      // `callbacks.jwt` receives `user` (sign-in) and is never re-stamped,
      // so it is stable across re-encode. `?? iat` is a deliberate fallback
      // for tokens issued before this field existed — they are not treated
      // as revoked, they simply age out within `maxAge` (30 days) like any
      // other legacy token.
      const issued =
        (token as { authTime?: number; iat?: number }).authTime ?? (token as { iat?: number }).iat;
      // `jwt.id` is typed as required but that is not runtime-enforced; a
      // token without one must not turn into a Redis GET on a key that ends
      // in `:undefined`.
      if (jwt.id && (await isSessionRevoked(jwt.id, issued))) {
        return { ...session, user: undefined } as unknown as typeof session;
      }
      session.user.id = jwt.id as string;
      session.user.role = jwt.role as UserRole;
      if (jwt.projectId) session.user.projectId = jwt.projectId;
      return session;
    },
    authorized({ auth: session, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!session?.user;
      const pathnameWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, "/");

      // /dev/* stays public here; it is gated by the page's own build-time
      // guard instead (audit S-L3), which returns 404 from any deployed build.
      // Requiring a session would not add protection — the page holds no data —
      // and would only make the dev-only route unusable without logging in.
      const isPublic =
        PUBLIC_PATHS.has(pathnameWithoutLocale) ||
        pathnameWithoutLocale === "/" ||
        pathnameWithoutLocale.startsWith("/api/auth") ||
        pathnameWithoutLocale === "/api/health" ||
        pathnameWithoutLocale.startsWith("/dev/");
      if (isPublic) return true;
      if (isLoggedIn) return true;

      // A boolean here is silently discarded by next-auth's dispatch when a
      // handler is passed to `auth()` — which is why PUBLIC_PATHS had no
      // runtime effect (#88). Only a Response is honoured.
      if (pathnameWithoutLocale.startsWith("/api/")) {
        // Never redirect an API caller to an HTML login page.
        return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
      }
      const locale = /^\/([a-z]{2})(\/|$)/.exec(pathname)?.[1] ?? "de";
      return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.nextUrl));
    },
  },
};
