import type { Metadata } from "next";

import { env } from "@/lib/env";

interface RouteMetadataInput {
  locale: string;
  /** Path after the locale segment, with no leading slash: "changelog", "impressum". */
  path: string;
  title: string;
  description: string;
}

/**
 * Metadata for one indexable marketing route.
 *
 * Spec §8.4 requires title, description, canonical and de/en `hreflang`
 * alternates on every route — but only the landing page had them, so the
 * changelog and both legal pages were published in the sitemap while inheriting
 * the root layout's generic title, with no canonical and no alternates. Two
 * locales of the same page with no `hreflang` between them are duplicate
 * content to a crawler.
 *
 * Centralised rather than repeated per route so the next indexable page cannot
 * be added with three of the four fields: the shape is the function signature,
 * and `src/test/pages/marketing-seo.test.ts` asserts every route in the sitemap
 * reaches it.
 */
export function marketingRouteMetadata({
  locale,
  path,
  title,
  description,
}: RouteMetadataInput): Metadata {
  // Marketing and the authenticated app share one deployment, so the app origin
  // is the site origin — same reasoning as the landing page's own metadata.
  const base = env.NEXT_PUBLIC_APP_URL;
  const url = `${base}/${locale}/${path}`;

  return {
    title: `${title} — Evidoxa`,
    description,
    alternates: {
      canonical: url,
      languages: {
        de: `${base}/de/${path}`,
        en: `${base}/en/${path}`,
      },
    },
    openGraph: { title: `${title} — Evidoxa`, description, url, type: "website" },
  };
}
