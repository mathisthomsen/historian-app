import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

const PUBLIC_PATHS = ["", "/changelog", "/impressum", "/datenschutz"] as const;
const LOCALES = ["de", "en"] as const;

// Marketing and the authenticated app are served from the same Next
// deployment, so the app origin is the site origin. If they are ever split
// into separate deployments, this needs its own validated env var.
const baseUrl = env.NEXT_PUBLIC_APP_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.flatMap((locale) =>
    PUBLIC_PATHS.map((path) => ({
      url: `${baseUrl}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.6,
    })),
  );
}
