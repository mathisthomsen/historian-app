import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Guard for the output-sink premises of docs/specs/150-plain-text-storage/plan.md
 * (L2, L3): stored text reaches the browser only through React's escaping JSX,
 * and the email templates escape through `src/lib/html.ts`.
 *
 * Deliberately a text scan, not a parser: it is meant to be hard to satisfy by
 * accident and easy to read. A new legitimate use means adding the file to the
 * allow-list below, with a reason, in the same change.
 */

const SRC = join(process.cwd(), "src");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx|js|jsx|mjs)$/.test(entry.name) && !/\.test\.[tj]sx?$/.test(entry.name)
      ? [path]
      : [];
  });
}

const files = sourceFiles(SRC).map((path) => ({
  path: relative(SRC, path).split(sep).join("/"),
  text: readFileSync(path, "utf8"),
}));

/** Both render only constants: an inline boot script and JSON-LD built from literals. */
const DANGEROUS_HTML_ALLOWED = [
  "app/[locale]/(marketing)/layout.tsx",
  "app/[locale]/(marketing)/page.tsx",
];

describe("HTML sinks (plan 150, L2 and L3)", () => {
  it("scans a plausible number of source files", () => {
    // Guards the guard: an empty scan would pass every assertion below.
    expect(files.length).toBeGreaterThan(100);
  });

  it("uses dangerouslySetInnerHTML only in the two audited marketing files", () => {
    const users = files
      .filter((f) => f.text.includes("dangerouslySetInnerHTML"))
      .map((f) => f.path)
      .sort();
    expect(users).toEqual([...DANGEROUS_HTML_ALLOWED].sort());
  });

  it("has no generateMetadata that reads from Prisma", () => {
    const offenders: string[] = [];
    let seen = 0;

    for (const f of files) {
      const lines = f.text.split("\n");
      lines.forEach((line, i) => {
        if (!/\b(function|const)\s+generateMetadata\b/.test(line)) return;
        seen += 1;
        // The function ends at the next line that is only a closing brace; a
        // parameter list such as `}: {` or `}): Promise<Metadata> {` is not one.
        let end = i + 1;
        while (end < lines.length && !/^};?\s*$/.test(lines[end] ?? "")) end += 1;
        const body = lines.slice(i, end + 1).join("\n");
        // Guards the extraction: a body cut short at the signature has no return.
        expect(body, f.path).toMatch(/\breturn\b/);
        if (/\bprisma\b|\bdb\b|@\/lib\/db|\.find(Many|First|Unique)|\$queryRaw/.test(body)) {
          offenders.push(f.path);
        }
      });
    }

    expect(seen).toBeGreaterThan(5); // the scan found the functions it is meant to police
    expect(offenders).toEqual([]);
  });
});
