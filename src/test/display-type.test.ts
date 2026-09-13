import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "src");

/**
 * Tailwind v4 cannot tell whether `text-[var(--x)]` means a font size or a
 * colour, and resolves the ambiguity as *colour*. Every display heading on the
 * marketing surface was written that way and therefore rendered at the
 * inherited 16px — measured 2026-09-12 at 1440x900, where the editorial passage
 * computed to 16px against a `--text-display-md` of `clamp(2.5rem, ...)`. The
 * hero, both legal pages, the changelog and the CTA band were all affected.
 *
 * The fix is the explicit `length:` hint. This test is the guardrail, because
 * the broken form produces no build error, no type error and no visual clue
 * beyond type that is merely smaller than intended.
 */
describe("display type tokens", () => {
  it("never applies a font-size token through an untyped arbitrary value", () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        // Tests are excluded: they quote the broken form on purpose, both to
        // document it and to assert against it.
        if (entry.isDirectory()) {
          if (entry.name !== "test") walk(full);
        } else if (
          entry.name.endsWith(".tsx") &&
          /text-\[var\(--text-/.test(readFileSync(full, "utf8"))
        ) {
          offenders.push(full.replace(`${SRC}/`, ""));
        }
      }
    };
    walk(SRC);
    expect(offenders).toEqual([]);
  });
});
