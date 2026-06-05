import type { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";

const DEFAULT_LOCALE = "de";

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
    authorized({ request }) {
      const { pathname } = request.nextUrl;
      const locale = pathname.match(/^\/([a-z]{2})/)?.[1] ?? DEFAULT_LOCALE;
      const pathnameWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, "/");

      // Allow API routes and the holding page through; redirect everything else.
      if (pathnameWithoutLocale === "/holding" || pathnameWithoutLocale.startsWith("/api/")) {
        return true;
      }

      return NextResponse.redirect(new URL(`/${locale}/holding`, request.url));
    },
  },
};
