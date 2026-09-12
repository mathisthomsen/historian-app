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
const LOCALES = ["de", "en"] as const;

// Marketing and the authenticated app are served from the same Next
// deployment, so the app origin is the site origin. If they are ever split
// into separate deployments, this needs its own validated env var.
const base = env.NEXT_PUBLIC_APP_URL;

export default function robots(): MetadataRoute.Robots {
  const disallowAuthenticated = LOCALES.flatMap((locale) =>
    AUTHENTICATED_SEGMENTS.map((segment) => `/${locale}/${segment}`),
  );

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", ...disallowAuthenticated],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
