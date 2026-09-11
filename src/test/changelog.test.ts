import { describe, expect, it } from "vitest";

import { listReleases } from "@/lib/changelog";

describe("listReleases", () => {
  it("returns releases newest first", async () => {
    const releases = await listReleases("de");
    expect(releases.length).toBeGreaterThan(0);
    const versions = releases.map((r) => r.version);
    expect([...versions].sort().reverse()).toEqual(versions);
  });

  it("parses version, date and title from frontmatter", async () => {
    const releases = await listReleases("de");
    const first = releases[0]!;
    expect(first.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(first.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(first.title).toBeTruthy();
  });

  it("falls back to the German entry when a locale file is missing", async () => {
    const releases = await listReleases("en");
    expect(releases.length).toBeGreaterThan(0);
  });
});
