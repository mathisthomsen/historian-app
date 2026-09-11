import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

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
});
