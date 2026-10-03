import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Guard for docs/specs/150-plain-text-storage/plan.md, T3 (decision D1 ii):
 * user text is stored exactly as typed, and `sanitize-html` / `src/lib/sanitize.ts`
 * are gone so nothing can call them again.
 *
 * It scans import-shaped references (static and dynamic imports, `require`,
 * `vi.mock` and friends), tests included: a test that mocks the removed module
 * is the "mock that hides the write path" this change exists to delete.
 */

const ROOT = process.cwd();
const SRC = join(ROOT, "src");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx|js|jsx|mjs)$/.test(entry.name) ? [path] : [];
  });
}

const files = sourceFiles(SRC).map((path) => ({
  path: relative(SRC, path).split(sep).join("/"),
  text: readFileSync(path, "utf8"),
}));

// A module specifier naming the library or the deleted wrapper, in quotes.
const SPECIFIER =
  /["'](?:sanitize-html|@types\/sanitize-html|@\/lib\/sanitize|(?:\.{1,2}\/)+(?:lib\/)?sanitize)(?:\.ts)?["']/;

describe("sanitize-html is gone (plan 150, T3)", () => {
  it("scans a plausible number of source files", () => {
    // Guards the guard: an empty scan would pass every assertion below.
    expect(files.length).toBeGreaterThan(100);
  });

  it("imports neither sanitize-html nor @/lib/sanitize anywhere in src/", () => {
    const offenders = files.filter((f) => SPECIFIER.test(f.text)).map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it("no longer has the wrapper module or its test", () => {
    expect(existsSync(join(SRC, "lib", "sanitize.ts"))).toBe(false);
    expect(existsSync(join(SRC, "lib", "sanitize.test.ts"))).toBe(false);
  });

  it("no longer declares the dependency", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const declared = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(Object.keys(declared).filter((name) => /sanitize-html/.test(name))).toEqual([]);
  });
});
