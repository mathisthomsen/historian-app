import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // NEXT_PUBLIC_SITE_URL is not defined anywhere in this repo (checked env.ts,
  // .env.example, next.config.ts, vercel.json) — this fallback is UNVERIFIED.
  // Confirm the real production hostname before merging and replace it.
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://evidoxa.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/de/dashboard", "/en/dashboard", "/de/persons", "/en/persons"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
