import type { UserRole } from "@prisma/client";
import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";

const PUBLIC_PATHS = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/verify",
  "/auth/forgot-password",
  "/auth/reset-password",
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
        if (user.projectId) token.projectId = user.projectId;
      }
      return token;
    },
    session({ session, token }) {
      const jwt = token as JWT;
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
      return isLoggedIn;
    },
  },
};
