import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

// robots.ts and sitemap.ts both read env.NEXT_PUBLIC_APP_URL. The real
// module parses the full server env (DATABASE_URL, AUTH_SECRET, ...) via
// zod at import time, which vitest does not populate — so, like
// src/lib/email.test.ts, mock the module rather than relying on process.env.
vi.mock("@/lib/env", () => ({
  env: { NEXT_PUBLIC_APP_URL: "http://localhost:3000" },
}));

const robots = (await import("@/app/robots")).default;
const sitemap = (await import("@/app/sitemap")).default;

const LOCALES = ["de", "en"] as const;

/**
 * The ground truth for "which top-level segments are the authenticated app"
 * is the filesystem, not a hand-maintained list — so a route added under
 * src/app/[locale]/(app)/ and forgotten in robots.ts fails this test instead
 * of silently becoming crawlable.
 */
function authenticatedSegments(): string[] {
  // Built with path.resolve rather than `new URL(..., import.meta.url)`:
  // the `[locale]` and `(app)` path segments contain characters ("[", "]")
  // that the URL parser treats specially (e.g. IPv6 host literals) and
  // rejects here.
  const testFileDir = path.dirname(fileURLToPath(import.meta.url));
  const appDir = path.resolve(testFileDir, "../../app/[locale]/(app)");
  return readdirSync(appDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

describe("sitemap", () => {
  it("lists both locales of every public route", () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const path of ["", "/changelog", "/impressum", "/datenschutz"]) {
      expect(urls.some((u) => u.endsWith(`/de${path}`))).toBe(true);
      expect(urls.some((u) => u.endsWith(`/en${path}`))).toBe(true);
    }
  });

  it("does not expose authenticated routes", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls.some((u) => u.includes("/dashboard"))).toBe(false);
    expect(urls.some((u) => u.includes("/persons"))).toBe(false);
  });
});

describe("robots", () => {
  it("disallows the authenticated app and the API", () => {
    const rules = robots().rules;
    const disallow = Array.isArray(rules)
      ? rules.flatMap((r) => r.disallow ?? [])
      : (rules.disallow ?? []);
    expect(disallow).toEqual(expect.arrayContaining(["/api/"]));
  });

  it("disallows every authenticated route segment found under (app), in both locales", () => {
    const segments = authenticatedSegments();
    // Guard against the directory scan itself silently finding nothing —
    // an empty list would make the loop below pass vacuously.
    expect(segments.length).toBeGreaterThan(0);

    const rules = robots().rules;
    const disallow = Array.isArray(rules)
      ? rules.flatMap((r) => r.disallow ?? [])
      : (rules.disallow ?? []);

    for (const segment of segments) {
      for (const locale of LOCALES) {
        expect(disallow, `expected /${locale}/${segment} to be disallowed`).toContain(
          `/${locale}/${segment}`,
        );
      }
    }
  });
});

/**
 * Every route the sitemap publishes must carry its own metadata.
 *
 * Spec §8.4 requires title, description, canonical and de/en `hreflang` on each
 * route, but only the landing page had `generateMetadata` — the changelog and
 * both legal pages were published in the sitemap while inheriting the root
 * layout's generic title, with no canonical and no alternates between the two
 * locales. That is duplicate content to a crawler, and it was invisible because
 * nothing tied "is in the sitemap" to "has metadata".
 *
 * This is that tie. The filesystem is the ground truth on both sides, so a new
 * indexable marketing route fails here until it has metadata of its own.
 */
describe("indexable marketing routes carry their own metadata", () => {
  const MARKETING_DIR = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "app",
    "[locale]",
    "(marketing)",
  );

  function marketingRoutePages(): { segment: string; file: string }[] {
    return readdirSync(MARKETING_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("("))
      .map((entry) => ({
        segment: entry.name,
        file: path.join(MARKETING_DIR, entry.name, "page.tsx"),
      }))
      .filter((route) => readdirSync(path.dirname(route.file)).includes("page.tsx"));
  }

  it("finds the routes it is meant to be checking", () => {
    // Guards against the test passing because the glob matched nothing.
    expect(
      marketingRoutePages()
        .map((r) => r.segment)
        .sort(),
    ).toEqual(["changelog", "datenschutz", "impressum"]);
  });

  it.each(marketingRoutePages())("$segment exports generateMetadata", async ({ file }) => {
    const source = await import("node:fs/promises").then((fs) => fs.readFile(file, "utf8"));
    expect(source).toMatch(/export async function generateMetadata/);
    expect(source).toMatch(/marketingRouteMetadata/);
  });

  it("builds a canonical and both hreflang alternates for a route", async () => {
    const { marketingRouteMetadata } = await import("@/lib/marketing-metadata");
    const meta = marketingRouteMetadata({
      locale: "en",
      path: "changelog",
      title: "Changelog",
      description: "Every Evidoxa release.",
    });

    expect(meta.alternates?.canonical).toBe("http://localhost:3000/en/changelog");
    expect(meta.alternates?.languages).toEqual({
      de: "http://localhost:3000/de/changelog",
      en: "http://localhost:3000/en/changelog",
    });
    expect(meta.title).toContain("Changelog");
    expect(meta.description).toBeTruthy();
  });
});
