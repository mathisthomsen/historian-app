import type { MetadataRoute } from "next";

const PUBLIC_PATHS = ["", "/changelog", "/impressum", "/datenschutz"] as const;
const LOCALES = ["de", "en"] as const;

function baseUrl(): string {
  // NEXT_PUBLIC_SITE_URL is not defined anywhere in this repo (checked env.ts,
  // .env.example, next.config.ts, vercel.json) — this fallback is UNVERIFIED.
  // Confirm the real production hostname before merging and replace it.
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://evidoxa.com";
}

export default function sitemap(): MetadataRoute.Sitemap {
  return LOCALES.flatMap((locale) =>
    PUBLIC_PATHS.map((path) => ({
      url: `${baseUrl()}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.6,
    })),
  );
}
