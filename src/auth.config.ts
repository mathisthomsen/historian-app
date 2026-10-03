import type { UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import type { NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";

import { routing } from "@/i18n/routing";
import { isSessionRevoked } from "@/lib/session-revocation";

// Every directory under `src/app/[locale]/(app)/` — the only protected route
// group. Everything else under `[locale]/` is `(auth)`, `(marketing)`, `dev`,
// or the `[...catchAll]` 404, and must fall through as public so an unknown
// path reaches Next's 404 instead of demanding a login (#128, TC-13).
//
// This is a deny-list, and a deny-list fails open on omission: forgetting to
// add a new protected directory here leaves it ungated at this layer. The
// real defence is that every page under `(app)` calls
// `requireUserOrRedirect()` itself — this list only decides whether an
// anonymous visitor bounces at the edge or reaches the page and bounces
// there. `auth-config.test.ts` reads this directory at runtime and fails the
// suite if a new subdirectory is missing from this set.
const GATED_PREFIXES = new Set([
  "admin",
  "dashboard",
  "events",
  "persons",
  "relations",
  "settings",
  "sources",
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
        // why revocation compares against this instead of `iat`. Milliseconds,
        // not seconds — see `src/lib/session-revocation.ts` for why.
        token.authTime = Date.now();
        if (user.projectId) token.projectId = user.projectId;
      } else {
        // Legacy sessions minted before `authTime` existed carry only `iat`.
        // This callback receives the token as decoded from the incoming
        // cookie, *before* `@auth/core` re-encodes it with a fresh `iat` — so
        // `token.iat` here is still whatever was on the request's cookie, not
        // a value this app has already bumped forward. `??=` fires exactly
        // once per token: the first time this backfill runs, it freezes
        // `authTime`, and every later re-encode carries that frozen value
        // forward unchanged even though `iat` keeps moving. Without this, the
        // `session` callback below would have nothing but the moving `iat` to
        // compare, and a revoked cookie is re-admitted on its second request
        // once that request's response re-encodes `iat` to `now`.
        //
        // Trade-off: a token with no usable `iat` at all falls back to
        // `Date.now()`, i.e. treated as freshly issued and so not caught by
        // any *existing* revocation floor. The alternative — epoch 0, always
        // revoked — would lock out any session with a malformed token, which
        // is the fail-closed outcome this design rejects; malformed-`iat` is
        // not a case the probe (2026-09-24) has ever observed in practice.
        const legacyToken = token as { authTime?: number; iat?: number };
        legacyToken.authTime ??=
          typeof legacyToken.iat === "number" ? legacyToken.iat * 1000 : Date.now();
      }
      return token;
    },
    async session({ session, token }) {
      const jwt = token as JWT;
      // Revocation compares against `authTime` only. Measured against the
      // installed @auth/core: on the JWT strategy, `jwt.encode` re-signs the
      // token on *every* session read (not only at `updateAge` rotation), and
      // jose's `.setIssuedAt()` is called with no argument — so `iat` is
      // overwritten with `now` on every read. A previous version of this
      // callback fell back to `?? iat` for tokens without `authTime`; that
      // fallback was itself the escape it was meant to guard against — `iat`
      // is exactly the moving value @auth/core rewrites, so a revoked cookie
      // was refused once, came back with a freshly stamped `iat`, and was
      // admitted on every request after that (GHSA-h32c-m6mx-pmw6). The `jwt`
      // callback above now backfills `authTime` for every legacy token before
      // this callback ever sees it, so there is no case left where falling
      // back to `iat` is needed — and no fallback here means one that
      // silently reintroduces the escape.
      const issued = (token as { authTime?: number }).authTime;
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

      // Only strip a segment that is an actual supported locale. The old
      // regex stripped any two-letter segment unconditionally, so
      // `/fr/dashboard` became `/dashboard`, matched a gated prefix below,
      // and redirected to `/fr/auth/login` — a class of unknown URLs that
      // still redirected instead of falling through to
      // `[locale]/layout.tsx`'s 404 (that layout checks the same
      // `routing.locales` list). Fixes #127, folded into this PR because the
      // regression it describes is a narrower case of the one fixed above.
      const localeMatch = /^\/([a-z]{2})(\/|$)/.exec(pathname);
      const requestedLocale = localeMatch?.[1];
      const supportedLocales = routing.locales as readonly string[];
      const isSupportedLocale = !!requestedLocale && supportedLocales.includes(requestedLocale);
      const pathnameWithoutLocale = isSupportedLocale
        ? pathname.replace(/^\/[a-z]{2}(\/|$)/, "/")
        : pathname;

      // A boolean here is silently discarded by next-auth's dispatch when a
      // handler is passed to `auth()` — which is why an inert PUBLIC_PATHS
      // list had no runtime effect (#88). Only a Response is honoured.
      if (pathnameWithoutLocale.startsWith("/api/")) {
        if (
          pathnameWithoutLocale.startsWith("/api/auth") ||
          pathnameWithoutLocale === "/api/health" ||
          // Exact matches, never `startsWith`: a prefix here would also open
          // `/api/access-requests/…` (the admin decision route's sibling) and
          // anything under `/api/internal/`. #29 §4.1 (public request form)
          // and §4.6 (purge, which authenticates itself with a bearer secret).
          pathnameWithoutLocale === "/api/access-request" ||
          pathnameWithoutLocale === "/api/internal/purge-access-requests"
        ) {
          return true;
        }
        if (isLoggedIn) return true;
        // Never redirect an API caller to an HTML login page.
        return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
      }

      // Gate only the known protected prefixes (see GATED_PREFIXES above).
      // Everything else — marketing, auth pages, /dev/*, and unknown paths —
      // falls through so the catch-all route can 404 or render normally.
      const firstSegment = pathnameWithoutLocale.split("/")[1] ?? "";
      if (!GATED_PREFIXES.has(firstSegment)) return true;
      if (isLoggedIn) return true;

      // Only reachable when isSupportedLocale is true (the gate above falls
      // through otherwise), but validated explicitly rather than relied on,
      // so this can never build a redirect target like `/fr/auth/login`.
      const locale = isSupportedLocale ? requestedLocale : routing.defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.nextUrl));
    },
  },
};
