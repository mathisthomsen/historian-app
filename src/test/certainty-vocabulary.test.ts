import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const ROOTS = [
  join(process.cwd(), "src", "components", "marketing"),
  join(process.cwd(), "src", "app", "[locale]", "(marketing)"),
];

/**
 * Files permitted to reach for the certainty vocabulary, and why.
 *
 * `Specimens.tsx` renders the certainty scale itself and a date whose year
 * carries a real per-field certainty. `RelationDiagram.tsx` annotates the one
 * edge that carries a relation's own certainty — the scope the model actually
 * uses. `HeroAppFrame.tsx` depicts the real application's record list, where
 * every row is a record whose field genuinely has a certainty; that is the
 * vocabulary used at exactly the scope it means. Nothing else on the marketing
 * surface is describing how well evidenced an assertion is, so nothing else may
 * use the palette.
 */
const ALLOWED = new Set(["Specimens.tsx", "RelationDiagram.tsx", "HeroAppFrame.tsx"]);

/**
 * `--color-certainty-*` and `CertaintyMarker` encode one scholarly concept: the
 * four levels at which a *claim* can be evidenced. README §2 records that
 * decimal confidence scores were rejected because a number implies a
 * statistical basis the model does not have — the palette carries the same
 * weight of meaning, and spending it on something that is not an assertion
 * teaches visitors a distinction the product does not make.
 *
 * This has now gone wrong twice, in two different shapes:
 *
 *  - `OpenDevelopment` used `CertaintyMarker` as a roadmap-status bullet, so a
 *    screen reader announced "Gewissheit: Sicher" before "shipped". Commit
 *    92e03e0 removed the marker but deliberately kept the certainty colours,
 *    fixing the audible half and leaving the visual half in place.
 *  - `RelationDiagram` stroked its entity-type nodes from the same family, so
 *    Person read as certain and Source as unknown — one panel after the page
 *    had taught exactly that palette. Found in review of PR #96.
 *
 * Both were judgement calls a reader had to make correctly from a comment.
 * This test turns the judgement into a decision that has to be made explicitly:
 * a new file using the vocabulary fails here until someone adds it to ALLOWED
 * and says why.
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

/** Comments discuss the tokens while explaining the rule; only code counts. */
function withoutComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, " "))
    .replace(/\/\/[^\n]*/g, (line) => line.replace(/[^\n]/g, " "));
}

/**
 * The token names, the component, and the four literal HSL values the tokens
 * resolve to. The literals matter: `opengraph-image.tsx` renders through Satori,
 * which cannot read CSS custom properties, so it inlined the four hues — and a
 * check that only looked for `--color-certainty-` walked straight past the
 * highest-reach instance on the whole surface.
 */
const CERTAINTY_VOCABULARY =
  /--color-certainty-|\bCertaintyMarker\b|hsl\(180,\s*50%|hsl\(215,\s*50%|hsl\(265,\s*35%|hsl\(38,\s*65%/;

describe("certainty vocabulary on the marketing surface", () => {
  it("is used only where something actually carries a certainty", () => {
    const offenders: string[] = [];

    for (const root of ROOTS) {
      for (const file of sourceFiles(root)) {
        const name = file.slice(file.lastIndexOf("/") + 1);
        if (ALLOWED.has(name)) continue;
        const source = withoutComments(readFileSync(file, "utf8"));
        if (!CERTAINTY_VOCABULARY.test(source)) continue;

        const line = source.split("\n").findIndex((l) => CERTAINTY_VOCABULARY.test(l)) + 1;
        offenders.push(
          `${file.replace(`${process.cwd()}/`, "")}:${line} — uses the certainty ` +
            `palette or CertaintyMarker for something that is not an assertion's certainty`,
        );
      }
    }

    expect(offenders).toEqual([]);
  });
});
