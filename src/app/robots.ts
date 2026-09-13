import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

// Every top-level route segment under src/app/[locale]/(app)/ — the
// authenticated app must never be crawlable. Keep this in sync with that
// directory; src/test/pages/marketing-seo.test.ts derives its expectation
// from the filesystem so a segment added there and forgotten here fails CI.
const AUTHENTICATED_SEGMENTS = [
  "dashboard",
  "events",
  "persons",
  "relations",
  "settings",
  "sources",
] as const;

// Segments under src/app/[locale]/(auth)/. These are *meant* to be publicly
// reachable — that is the point of a login page — so this is not a security
// boundary like the list above. They simply have no business in an index:
// they waste crawl budget on a site whose public surface is four pages, and a
// `reset-password` or `verify` URL sitting in search results is untidy at best.
//
// Measured on the live site before this existed: `/de/auth/login` was
// crawlable, with no `robots` meta tag on the page either.
const UNINDEXED_PUBLIC_SEGMENTS = ["auth"] as const;

const LOCALES = ["de", "en"] as const;

// Marketing and the authenticated app are served from the same Next
// deployment, so the app origin is the site origin. If they are ever split
// into separate deployments, this needs its own validated env var.
const base = env.NEXT_PUBLIC_APP_URL;

export default function robots(): MetadataRoute.Robots {
  const disallowAuthenticated = LOCALES.flatMap((locale) =>
    AUTHENTICATED_SEGMENTS.map((segment) => `/${locale}/${segment}`),
  );
  const disallowUnindexed = LOCALES.flatMap((locale) =>
    UNINDEXED_PUBLIC_SEGMENTS.map((segment) => `/${locale}/${segment}`),
  );

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", ...disallowAuthenticated, ...disallowUnindexed],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
