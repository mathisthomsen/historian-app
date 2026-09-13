import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROOTS = [
  join(process.cwd(), "src", "components", "marketing"),
  join(process.cwd(), "src", "app", "[locale]", "(marketing)"),
];

/**
 * Tailwind's preflight sets `list-style: none` on every <ul>/<ol>. In WebKit
 * that strips the implicit list/listitem accessibility roles, so a styled list
 * reaches VoiceOver as unrelated lines of text with no count and no position
 * (issue #90). Restoring the roles explicitly is the fix, and it has to be done
 * at every list — which is exactly the kind of obligation a person forgets.
 *
 * It was forgotten: the band 2-4 redesign added the roles to three new lists
 * and missed a fourth in `changelog/page.tsx`, a file the same commit edited.
 * Code review caught it. This test is here so the next omission does not need
 * a reviewer.
 *
 * Scoped to the marketing surface deliberately. The app-side sweep is issue
 * #90's subject and would fail here for reasons this branch did not cause;
 * widening this test is that issue's job, not this one's.
 */
function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(full));
    else if (entry.name.endsWith(".tsx")) out.push(full);
  }
  return out;
}

/** Opening <ul>/<ol>/<li> tags, with whatever attributes precede the closing angle. */
const OPENING_TAG = /<(ul|ol|li)(\s[^>]*)?>/g;

/**
 * Comments mention these tags while explaining why the roles are needed, and a
 * scanner that counted those would report the very files that are correct.
 * Blanked rather than deleted so reported line numbers stay accurate.
 */
function withoutComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
    .replace(/\/\/[^\n]*/g, (line) => line.replace(/[^\n]/g, " "));
}

describe("marketing surface list semantics", () => {
  it("gives every list and list item an explicit role", () => {
    const offenders: string[] = [];

    for (const root of ROOTS) {
      for (const file of sourceFiles(root)) {
        const raw = readFileSync(file, "utf8");
        const source = withoutComments(raw);
        const lines = raw.split("\n");

        for (const match of source.matchAll(OPENING_TAG)) {
          const [tag, name, attributes = ""] = match;
          const expected = name === "li" ? "listitem" : "list";
          if (attributes.includes(`role="${expected}"`)) continue;
          const line = source.slice(0, match.index).split("\n").length;
          offenders.push(
            `${file.replace(`${process.cwd()}/`, "")}:${line} — ${tag.trim()} ` +
              `needs role="${expected}" (${lines[line - 1]?.trim()})`,
          );
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
