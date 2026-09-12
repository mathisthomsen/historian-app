import { describe, expect, it, vi } from "vitest";

import { compareVersionsDesc, listReleases } from "@/lib/changelog";

function frontmatter(version: string, date: string, title: string, body: string): string {
  return `---\nversion: "${version}"\ndate: "${date}"\ntitle: "${title}"\n---\n\n${body}\n`;
}

// Synthetic multi-release, multi-locale fixture, held in memory rather than
// on disk under content/changelog — so these tests get real discriminating
// power without adding a non-factual entry to the live, shipped changelog
// page. Deliberately includes:
//  - a double-digit segment (0.10.0) to catch a lexicographic-sort
//    regression (0.9.0 must not outrank it);
//  - a release that exists only in German (0.9.0) to exercise the real
//    locale-fallback path, not just assert a non-empty array;
//  - a stray non-.mdx file to exercise the extension filter.
const files: Record<string, string> = {
  ".DS_Store": "not mdx — must be filtered, not parsed as a release",
  "0.1.0.de.mdx": frontmatter("0.1.0", "2026-01-01", "Eins", "Erster Eintrag."),
  "0.1.0.en.mdx": frontmatter("0.1.0", "2026-01-01", "One", "First entry."),
  "0.9.0.de.mdx": frontmatter(
    "0.9.0",
    "2026-02-01",
    "Neun (nur Deutsch)",
    "Nur auf Deutsch verfuegbar.",
  ),
  "0.10.0.de.mdx": frontmatter("0.10.0", "2026-03-01", "Zehn", "Zehnter Eintrag."),
  "0.10.0.en.mdx": frontmatter("0.10.0", "2026-03-01", "Ten", "Tenth entry."),
};

vi.mock("node:fs/promises", () => {
  const readdir = vi.fn(async () => Object.keys(files));
  const readFile = vi.fn(async (path: string) => {
    const name = path.split("/").pop() ?? "";
    const raw = files[name];
    if (raw === undefined) {
      throw Object.assign(new Error(`ENOENT: no such file, open '${path}'`), { code: "ENOENT" });
    }
    return raw;
  });
  return { readdir, readFile, default: { readdir, readFile } };
});

describe("compareVersionsDesc", () => {
  it("sorts numerically, not lexicographically — 0.10.0 outranks 0.9.0", () => {
    const versions = ["0.9.0", "0.10.0", "0.1.0"];
    expect([...versions].sort(compareVersionsDesc)).toEqual(["0.10.0", "0.9.0", "0.1.0"]);
  });
});

describe("listReleases", () => {
  it("returns releases newest first, numerically not lexicographically", async () => {
    const releases = await listReleases("de");
    expect(releases.map((r) => r.version)).toEqual(["0.10.0", "0.9.0", "0.1.0"]);
  });

  it("parses version, date and title from frontmatter, ignoring non-mdx files", async () => {
    const releases = await listReleases("de");
    const first = releases[0]!;
    expect(first.version).toBe("0.10.0");
    expect(first.date).toBe("2026-03-01");
    expect(first.title).toBe("Zehn");
    expect(releases).toHaveLength(3);
  });

  it("falls back to the German entry when a locale file is missing", async () => {
    const releases = await listReleases("en");
    // 0.9.0.en.mdx does not exist in the fixture: this only passes if the
    // preferred-locale read failed and the .catch() chain read the German
    // file instead, rather than the release being dropped or left untitled.
    const germanOnly = releases.find((r) => r.version === "0.9.0");
    expect(germanOnly?.title).toBe("Neun (nur Deutsch)");
    // Sanity check that real translations still win where they exist.
    const translated = releases.find((r) => r.version === "0.10.0");
    expect(translated?.title).toBe("Ten");
  });
});
