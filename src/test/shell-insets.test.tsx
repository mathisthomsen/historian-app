import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { AppShell } from "@/components/shell/app-shell";
import { renderWithProviders, screen } from "@/test/render";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: "de" }),
  usePathname: () => "/de/persons",
}));

const globalsCss = readFileSync(join(process.cwd(), "src/styles/globals.css"), "utf8");

/**
 * Guards issue #32. Measured on 2026-08-11 against a dev server at /de/persons:
 *
 *   viewport | main padding-left | usable width | doc scrollWidth | content under bar
 *   375x400  | 224px -> 0px      | 151 -> 375   | 455 -> 375      | 63.5px -> 0px
 *   390x400  | 224px -> 0px      | 166 -> 390   | 455 -> 390      | 63.5px -> 0px
 *   768x600  | 224px -> 0px      | 544 -> 768   | 768 -> 768      | 63.5px -> 0px
 *   1280x800 | 224px (unchanged, sidebar visible)                 | bar hidden
 *
 * jsdom does not evaluate media queries against a viewport, so the breakpoint
 * gating is asserted against the stylesheet source and the class wiring against
 * the rendered tree.
 */
describe("app shell insets", () => {
  it("applies both the sidebar and the bottom-bar inset to <main>", () => {
    renderWithProviders(
      <AppShell>
        <p>content</p>
      </AppShell>,
    );

    const main = screen.getByRole("main");
    expect(main.className).toContain("bottombar-inset");
    expect(main.className).toMatch(/sidebar-inset(-collapsed)?/);
  });

  it("never applies the sidebar gutter outside a min-width media query", () => {
    // The unconditional `padding-left: var(--sidebar-width-open)` is what
    // reserved 224px on a 375px phone with no sidebar in it.
    const declarations = [
      "padding-left: var(--sidebar-width-open)",
      "padding-left: var(--sidebar-width-collapsed)",
    ];

    for (const declaration of declarations) {
      const index = globalsCss.indexOf(declaration);
      expect(index, `${declaration} not found`).toBeGreaterThan(-1);

      const preceding = globalsCss.slice(0, index);
      const lastMediaOpen = preceding.lastIndexOf("@media (min-width: 64rem)");
      expect(lastMediaOpen, `${declaration} is not inside a min-width query`).toBeGreaterThan(-1);

      // The rule must still be inside that query: no closing of it in between.
      const between = preceding.slice(lastMediaOpen);
      const opens = (between.match(/\{/g) ?? []).length;
      const closes = (between.match(/\}/g) ?? []).length;
      expect(opens, `${declaration} sits after the media query closed`).toBeGreaterThan(closes);
    }
  });

  it("reserves space for the fixed bottom bar below lg, and none at lg", () => {
    expect(globalsCss).toMatch(
      /\.bottombar-inset\s*\{[^}]*padding-bottom:\s*calc\(4rem \+ env\(safe-area-inset-bottom/,
    );
    expect(globalsCss).toMatch(
      /@media \(min-width: 64rem\)\s*\{\s*\.bottombar-inset\s*\{\s*padding-bottom:\s*0/,
    );
  });
});
