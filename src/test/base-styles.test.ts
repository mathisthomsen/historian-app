/**
 * Base Styles Test Suite
 *
 * Tests the @layer base and @layer utilities rules defined in globals.css.
 * Runs in jsdom (Vitest). Because jsdom does not evaluate CSS stylesheets,
 * we use two strategies:
 *  1. Text search on the raw globals.css content for rules that cannot be
 *     reflected in jsdom (::selection, :focus-visible, @keyframes, etc.)
 *  2. injectTokensIntoDocument() + injected <style> blocks for rules that
 *     can be reflected via getComputedStyle.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { injectTokensIntoDocument, parseTokens, removeInjectedTokens } from "./tokens";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GLOBALS_CSS_PATH = resolve(process.cwd(), "src/styles/globals.css");

/** Raw globals.css text — used for text-search assertions. */
const rawCss = readFileSync(GLOBALS_CSS_PATH, "utf-8");

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeAll(() => {
  injectTokensIntoDocument();
});

afterAll(() => {
  removeInjectedTokens();
});

// ---------------------------------------------------------------------------
// TC-DS-BASE-01: Typography — body
// ---------------------------------------------------------------------------

describe("TC-DS-BASE-01: Typography — body", () => {
  it("globals.css contains body rule with font-family: var(--font-sans)", () => {
    expect(rawCss).toMatch(/body\s*\{[^}]*font-family\s*:\s*var\(--font-sans\)/s);
  });

  it("globals.css contains body rule with font-size: var(--text-base)", () => {
    expect(rawCss).toMatch(/body\s*\{[^}]*font-size\s*:\s*var\(--text-base\)/s);
  });

  it("globals.css contains body rule with line-height: var(--leading-base)", () => {
    expect(rawCss).toMatch(/body\s*\{[^}]*line-height\s*:\s*var\(--leading-base\)/s);
  });

  it("globals.css contains body rule with background-color using --color-background", () => {
    expect(rawCss).toMatch(/body\s*\{[^}]*background-color\s*:\s*var\(--color-background\)/s);
  });

  it("globals.css contains body rule with color using --color-foreground", () => {
    expect(rawCss).toMatch(/body\s*\{[^}]*color\s*:\s*var\(--color-foreground\)/s);
  });

  it("globals.css contains body transition-property covering background-color, color, border-color", () => {
    expect(rawCss).toMatch(/transition-property\s*:\s*background-color,\s*color,\s*border-color/);
  });

  it("globals.css contains body transition-duration: var(--duration-normal)", () => {
    expect(rawCss).toMatch(/transition-duration\s*:\s*var\(--duration-normal\)/);
  });

  it("globals.css contains body transition-timing-function: var(--ease-in-out)", () => {
    expect(rawCss).toMatch(/transition-timing-function\s*:\s*var\(--ease-in-out\)/);
  });

  it("--text-base token value is 1rem", () => {
    const { light } = parseTokens();
    expect(light.get("--text-base")).toBe("1rem");
  });

  it("--leading-base token value is 1.625", () => {
    const { light } = parseTokens();
    expect(light.get("--leading-base")).toBe("1.625");
  });
});

// ---------------------------------------------------------------------------
// TC-DS-BASE-02: Typography — headings
// ---------------------------------------------------------------------------

describe("TC-DS-BASE-02: Typography — headings", () => {
  it("globals.css contains h1 rule", () => {
    expect(rawCss).toMatch(/\bh1\b\s*\{/);
  });

  it("globals.css contains h2 rule", () => {
    expect(rawCss).toMatch(/\bh2\b\s*\{/);
  });

  it("globals.css contains h3 rule", () => {
    expect(rawCss).toMatch(/\bh3\b\s*\{/);
  });

  it("globals.css contains h4 rule", () => {
    expect(rawCss).toMatch(/\bh4\b\s*\{/);
  });

  it("h1 uses font-size: var(--text-3xl)", () => {
    expect(rawCss).toMatch(/\bh1\b\s*\{[^}]*font-size\s*:\s*var\(--text-3xl\)/s);
  });

  it("h1 uses font-weight: 600", () => {
    expect(rawCss).toMatch(/\bh1\b\s*\{[^}]*font-weight\s*:\s*600/s);
  });

  it("h1 uses line-height: var(--leading-3xl)", () => {
    expect(rawCss).toMatch(/\bh1\b\s*\{[^}]*line-height\s*:\s*var\(--leading-3xl\)/s);
  });

  it("h1 uses letter-spacing: var(--tracking-3xl)", () => {
    expect(rawCss).toMatch(/\bh1\b\s*\{[^}]*letter-spacing\s*:\s*var\(--tracking-3xl\)/s);
  });

  it("h1 uses color: var(--color-foreground)", () => {
    expect(rawCss).toMatch(/\bh1\b\s*\{[^}]*color\s*:\s*var\(--color-foreground\)/s);
  });

  it("h2 uses font-size: var(--text-2xl)", () => {
    expect(rawCss).toMatch(/\bh2\b\s*\{[^}]*font-size\s*:\s*var\(--text-2xl\)/s);
  });

  it("h2 uses font-weight: 600", () => {
    expect(rawCss).toMatch(/\bh2\b\s*\{[^}]*font-weight\s*:\s*600/s);
  });

  it("h2 uses line-height: var(--leading-2xl)", () => {
    expect(rawCss).toMatch(/\bh2\b\s*\{[^}]*line-height\s*:\s*var\(--leading-2xl\)/s);
  });

  it("h2 uses letter-spacing: var(--tracking-2xl)", () => {
    expect(rawCss).toMatch(/\bh2\b\s*\{[^}]*letter-spacing\s*:\s*var\(--tracking-2xl\)/s);
  });

  it("h3 uses font-size: var(--text-xl)", () => {
    expect(rawCss).toMatch(/\bh3\b\s*\{[^}]*font-size\s*:\s*var\(--text-xl\)/s);
  });

  it("h3 uses font-weight: 500", () => {
    expect(rawCss).toMatch(/\bh3\b\s*\{[^}]*font-weight\s*:\s*500/s);
  });

  it("h3 uses line-height: var(--leading-xl)", () => {
    expect(rawCss).toMatch(/\bh3\b\s*\{[^}]*line-height\s*:\s*var\(--leading-xl\)/s);
  });

  it("h3 uses letter-spacing: var(--tracking-xl)", () => {
    expect(rawCss).toMatch(/\bh3\b\s*\{[^}]*letter-spacing\s*:\s*var\(--tracking-xl\)/s);
  });

  it("h4 uses font-size: var(--text-lg)", () => {
    expect(rawCss).toMatch(/\bh4\b\s*\{[^}]*font-size\s*:\s*var\(--text-lg\)/s);
  });

  it("h4 uses font-weight: 500", () => {
    expect(rawCss).toMatch(/\bh4\b\s*\{[^}]*font-weight\s*:\s*500/s);
  });

  it("h4 uses line-height: var(--leading-lg)", () => {
    expect(rawCss).toMatch(/\bh4\b\s*\{[^}]*line-height\s*:\s*var\(--leading-lg\)/s);
  });

  it("h4 uses letter-spacing: var(--tracking-lg)", () => {
    expect(rawCss).toMatch(/\bh4\b\s*\{[^}]*letter-spacing\s*:\s*var\(--tracking-lg\)/s);
  });

  it("--text-3xl token is 1.875rem", () => {
    const { light } = parseTokens();
    expect(light.get("--text-3xl")).toBe("1.875rem");
  });

  it("--text-2xl token is 1.5rem", () => {
    const { light } = parseTokens();
    expect(light.get("--text-2xl")).toBe("1.5rem");
  });

  it("--text-xl token is 1.25rem", () => {
    const { light } = parseTokens();
    expect(light.get("--text-xl")).toBe("1.25rem");
  });

  it("--text-lg token is 1.125rem", () => {
    const { light } = parseTokens();
    expect(light.get("--text-lg")).toBe("1.125rem");
  });

  it("--leading-3xl token is 1.267", () => {
    const { light } = parseTokens();
    expect(light.get("--leading-3xl")).toBe("1.267");
  });

  it("--leading-2xl token is 1.333", () => {
    const { light } = parseTokens();
    expect(light.get("--leading-2xl")).toBe("1.333");
  });

  it("--tracking-3xl token is -0.02em", () => {
    const { light } = parseTokens();
    expect(light.get("--tracking-3xl")).toBe("-0.02em");
  });

  it("--tracking-2xl token is -0.015em", () => {
    const { light } = parseTokens();
    expect(light.get("--tracking-2xl")).toBe("-0.015em");
  });
});

// ---------------------------------------------------------------------------
// TC-DS-BASE-03: Focus ring styles
// ---------------------------------------------------------------------------

describe("TC-DS-BASE-03: Focus ring styles", () => {
  it("globals.css contains :focus-visible rule", () => {
    expect(rawCss).toMatch(/:focus-visible\s*\{/);
  });

  it(":focus-visible uses outline with --color-ring", () => {
    expect(rawCss).toMatch(/:focus-visible\s*\{[^}]*outline\s*:[^}]*var\(--color-ring\)/s);
  });

  it(":focus-visible outline is 2px solid", () => {
    expect(rawCss).toMatch(/:focus-visible\s*\{[^}]*outline\s*:\s*2px solid/s);
  });

  it(":focus-visible has outline-offset: 2px", () => {
    expect(rawCss).toMatch(/:focus-visible\s*\{[^}]*outline-offset\s*:\s*2px/s);
  });

  it("--color-ring token exists in light mode", () => {
    const { light } = parseTokens();
    expect(light.has("--color-ring")).toBe(true);
    expect(light.get("--color-ring")).toBeTruthy();
  });

  it("--color-ring token value is 245 40% 36% in light mode", () => {
    const { light } = parseTokens();
    expect(light.get("--color-ring")).toBe("245 40% 36%");
  });

  it("--color-ring token value is 245 40% 68% in dark mode", () => {
    const { dark } = parseTokens();
    expect(dark.get("--color-ring")).toBe("245 40% 68%");
  });
});

// ---------------------------------------------------------------------------
// TC-DS-BASE-04: Animation utility classes
// ---------------------------------------------------------------------------

describe("TC-DS-BASE-04: Animation utility classes", () => {
  it("globals.css contains .animate-in class", () => {
    expect(rawCss).toMatch(/\.animate-in\s*\{/);
  });

  it(".animate-in sets animation-fill-mode: both", () => {
    expect(rawCss).toMatch(/\.animate-in\s*\{[^}]*animation-fill-mode\s*:\s*both/s);
  });

  it(".animate-in uses duration-slow for animation-duration", () => {
    expect(rawCss).toMatch(
      /\.animate-in\s*\{[^}]*animation-duration\s*:\s*var\(--duration-slow\)/s,
    );
  });

  it(".animate-in uses ease-enter for animation-timing-function", () => {
    expect(rawCss).toMatch(
      /\.animate-in\s*\{[^}]*animation-timing-function\s*:\s*var\(--ease-enter\)/s,
    );
  });

  it("globals.css contains .animate-out class", () => {
    expect(rawCss).toMatch(/\.animate-out\s*\{/);
  });

  it(".animate-out sets animation-fill-mode: both", () => {
    expect(rawCss).toMatch(/\.animate-out\s*\{[^}]*animation-fill-mode\s*:\s*both/s);
  });

  it("globals.css contains .fade-in class", () => {
    expect(rawCss).toMatch(/\.fade-in\s*\{/);
  });

  it("globals.css contains .slide-in-from-top-2 or .slide-in-from-top class", () => {
    // The spec uses `.slide-in-from-top` (no -2 suffix)
    expect(rawCss).toMatch(/\.slide-in-from-top\b/);
  });

  it("globals.css contains .animate-skeleton-pulse class", () => {
    expect(rawCss).toMatch(/\.animate-skeleton-pulse\s*\{/);
  });

  it(".animate-skeleton-pulse uses skeleton-pulse keyframe", () => {
    expect(rawCss).toMatch(/\.animate-skeleton-pulse\s*\{[^}]*skeleton-pulse/s);
  });

  it("globals.css contains @keyframes skeleton-pulse", () => {
    expect(rawCss).toMatch(/@keyframes\s+skeleton-pulse/);
  });

  it("skeleton-pulse keyframe includes opacity: 0.4 at 50%", () => {
    expect(rawCss).toMatch(/skeleton-pulse[\s\S]*?50%\s*\{[^}]*opacity\s*:\s*0\.4/);
  });

  it("globals.css contains .scale-in class", () => {
    expect(rawCss).toMatch(/\.scale-in\s*\{/);
  });

  it("globals.css contains .scale-out class", () => {
    expect(rawCss).toMatch(/\.scale-out\s*\{/);
  });

  it("@keyframes scale-out exits to scale(0.97)", () => {
    expect(rawCss).toMatch(/scale-out[\s\S]*?scale\(0\.97\)/);
  });

  it("--duration-slow token is 300ms", () => {
    const { light } = parseTokens();
    expect(light.get("--duration-slow")).toBe("300ms");
  });

  it("--duration-normal token is 200ms", () => {
    const { light } = parseTokens();
    expect(light.get("--duration-normal")).toBe("200ms");
  });

  it("--ease-enter token exists", () => {
    const { light } = parseTokens();
    expect(light.get("--ease-enter")).toMatch(/cubic-bezier/);
  });
});

// ---------------------------------------------------------------------------
// TC-DS-BASE-05: Typography utility classes
// ---------------------------------------------------------------------------

describe("TC-DS-BASE-05: Typography utility classes", () => {
  it("globals.css contains .text-body class", () => {
    expect(rawCss).toMatch(/\.text-body\s*\{/);
  });

  it(".text-body uses font-size: var(--text-base)", () => {
    expect(rawCss).toMatch(/\.text-body\s*\{[^}]*font-size\s*:\s*var\(--text-base\)/s);
  });

  it(".text-body uses line-height: var(--leading-base)", () => {
    expect(rawCss).toMatch(/\.text-body\s*\{[^}]*line-height\s*:\s*var\(--leading-base\)/s);
  });

  it(".text-body uses font-weight: 400", () => {
    expect(rawCss).toMatch(/\.text-body\s*\{[^}]*font-weight\s*:\s*400/s);
  });

  it("globals.css contains .text-body-large class", () => {
    expect(rawCss).toMatch(/\.text-body-large\s*\{/);
  });

  it(".text-body-large uses font-size: var(--text-lg)", () => {
    expect(rawCss).toMatch(/\.text-body-large\s*\{[^}]*font-size\s*:\s*var\(--text-lg\)/s);
  });

  it("globals.css contains .text-caption class", () => {
    expect(rawCss).toMatch(/\.text-caption\s*\{/);
  });

  it(".text-caption uses font-size: var(--text-xs)", () => {
    expect(rawCss).toMatch(/\.text-caption\s*\{[^}]*font-size\s*:\s*var\(--text-xs\)/s);
  });

  it(".text-caption sets color using --color-muted-foreground", () => {
    expect(rawCss).toMatch(/\.text-caption\s*\{[^}]*color\s*:\s*var\(--color-muted-foreground\)/s);
  });

  it("globals.css contains .text-overline class", () => {
    expect(rawCss).toMatch(/\.text-overline\s*\{/);
  });

  it(".text-overline uses text-transform: uppercase", () => {
    expect(rawCss).toMatch(/\.text-overline\s*\{[^}]*text-transform\s*:\s*uppercase/s);
  });

  it(".text-overline uses letter-spacing: 0.08em", () => {
    expect(rawCss).toMatch(/\.text-overline\s*\{[^}]*letter-spacing\s*:\s*0\.08em/s);
  });

  it(".text-overline uses font-weight: 500", () => {
    expect(rawCss).toMatch(/\.text-overline\s*\{[^}]*font-weight\s*:\s*500/s);
  });

  it("globals.css contains .text-mono class", () => {
    expect(rawCss).toMatch(/\.text-mono\s*\{/);
  });

  it(".text-mono uses font-family: var(--font-mono)", () => {
    expect(rawCss).toMatch(/\.text-mono\s*\{[^}]*font-family\s*:\s*var\(--font-mono\)/s);
  });

  it(".text-mono uses font-variant-numeric: tabular-nums", () => {
    expect(rawCss).toMatch(/\.text-mono\s*\{[^}]*font-variant-numeric\s*:\s*tabular-nums/s);
  });

  it(".text-mono uses letter-spacing: 0", () => {
    expect(rawCss).toMatch(/\.text-mono\s*\{[^}]*letter-spacing\s*:\s*0/s);
  });

  it(".text-label uses font-weight: 500", () => {
    expect(rawCss).toMatch(/\.text-label\s*\{[^}]*font-weight\s*:\s*500/s);
  });

  it(".text-label does NOT set color property", () => {
    // Extract the .text-label block and verify no color property
    const labelMatch = /\.text-label\s*\{([^}]*)\}/.exec(rawCss);
    expect(labelMatch).not.toBeNull();
    const block = labelMatch![1];
    // Should not contain a bare color: declaration (not background-color etc.)
    expect(block).not.toMatch(/(?<![a-z-])color\s*:/);
  });
});

// ---------------------------------------------------------------------------
// TC-DS-BASE-06: Certainty badge utilities
// ---------------------------------------------------------------------------

describe("TC-DS-BASE-06: Certainty badge utilities", () => {
  it("globals.css contains .certainty-certain class", () => {
    expect(rawCss).toMatch(/\.certainty-certain\s*\{/);
  });

  it(".certainty-certain uses --color-certainty-certain-background", () => {
    expect(rawCss).toMatch(
      /\.certainty-certain\s*\{[^}]*background-color\s*:\s*var\(--color-certainty-certain-background\)/s,
    );
  });

  it(".certainty-certain uses --color-certainty-certain-border", () => {
    expect(rawCss).toMatch(
      /\.certainty-certain\s*\{[^}]*border-color\s*:\s*var\(--color-certainty-certain-border\)/s,
    );
  });

  it(".certainty-certain uses --color-certainty-certain-foreground for color", () => {
    expect(rawCss).toMatch(
      /\.certainty-certain\s*\{[^}]*color\s*:\s*var\(--color-certainty-certain-foreground\)/s,
    );
  });

  it("globals.css contains .certainty-probable class", () => {
    expect(rawCss).toMatch(/\.certainty-probable\s*\{/);
  });

  it("globals.css contains .certainty-possible class", () => {
    expect(rawCss).toMatch(/\.certainty-possible\s*\{/);
  });

  it("globals.css contains .certainty-unknown class", () => {
    expect(rawCss).toMatch(/\.certainty-unknown\s*\{/);
  });

  it("globals.css contains .certainty-unevidenced class", () => {
    expect(rawCss).toMatch(/\.certainty-unevidenced\s*\{/);
  });

  it(".certainty-unevidenced includes border-style: dashed", () => {
    expect(rawCss).toMatch(/\.certainty-unevidenced\s*\{[^}]*border-style\s*:\s*dashed/s);
  });

  it(".certainty-certain does NOT set border-style", () => {
    const match = /\.certainty-certain\s*\{([^}]*)\}/.exec(rawCss);
    expect(match).not.toBeNull();
    expect(match![1]).not.toMatch(/border-style/);
  });

  it(".certainty-probable does NOT set border-style", () => {
    const match = /\.certainty-probable\s*\{([^}]*)\}/.exec(rawCss);
    expect(match).not.toBeNull();
    expect(match![1]).not.toMatch(/border-style/);
  });

  it(".certainty-possible does NOT set border-style", () => {
    const match = /\.certainty-possible\s*\{([^}]*)\}/.exec(rawCss);
    expect(match).not.toBeNull();
    expect(match![1]).not.toMatch(/border-style/);
  });

  it(".certainty-unknown does NOT set border-style", () => {
    const match = /\.certainty-unknown\s*\{([^}]*)\}/.exec(rawCss);
    expect(match).not.toBeNull();
    expect(match![1]).not.toMatch(/border-style/);
  });

  it("--color-certainty-certain-background token is 180 40% 93% in light mode", () => {
    const { light } = parseTokens();
    expect(light.get("--color-certainty-certain-background")).toBe("180 40% 93%");
  });

  it("--color-certainty-unevidenced-background token is 20 10% 94% in light mode", () => {
    const { light } = parseTokens();
    expect(light.get("--color-certainty-unevidenced-background")).toBe("20 10% 94%");
  });

  it("--color-certainty-certain-background token is 180 25% 12% in dark mode", () => {
    const { dark } = parseTokens();
    expect(dark.get("--color-certainty-certain-background")).toBe("180 25% 12%");
  });
});

// ---------------------------------------------------------------------------
// TC-DS-BASE-07: Reduced motion
// ---------------------------------------------------------------------------

describe("TC-DS-BASE-07: Reduced motion", () => {
  it("globals.css contains @media (prefers-reduced-motion: reduce) block", () => {
    expect(rawCss).toMatch(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/);
  });

  it("reduced-motion block resets animation-duration to 0.01ms", () => {
    expect(rawCss).toMatch(
      /prefers-reduced-motion\s*:\s*reduce[\s\S]*?animation-duration\s*:\s*0\.01ms/,
    );
  });

  it("reduced-motion block resets transition-duration to 0.01ms", () => {
    expect(rawCss).toMatch(
      /prefers-reduced-motion\s*:\s*reduce[\s\S]*?transition-duration\s*:\s*0\.01ms/,
    );
  });

  it("reduced-motion block resets animation-iteration-count to 1", () => {
    expect(rawCss).toMatch(
      /prefers-reduced-motion\s*:\s*reduce[\s\S]*?animation-iteration-count\s*:\s*1/,
    );
  });

  it("reduced-motion block sets scroll-behavior: auto", () => {
    expect(rawCss).toMatch(/prefers-reduced-motion\s*:\s*reduce[\s\S]*?scroll-behavior\s*:\s*auto/);
  });

  it("reduced-motion overrides .animate-skeleton-pulse to animation: none", () => {
    expect(rawCss).toMatch(
      /prefers-reduced-motion\s*:\s*reduce[\s\S]*?\.animate-skeleton-pulse[\s\S]*?animation\s*:\s*none/,
    );
  });

  it("reduced-motion makes .slide-in-from-top use fade-in animation", () => {
    expect(rawCss).toMatch(
      /prefers-reduced-motion\s*:\s*reduce[\s\S]*?\.slide-in-from-top[\s\S]*?animation-name\s*:\s*fade-in/,
    );
  });

  it("reduced-motion makes .scale-in use fade-in animation", () => {
    expect(rawCss).toMatch(
      /prefers-reduced-motion\s*:\s*reduce[\s\S]*?\.scale-in[\s\S]*?animation-name\s*:\s*fade-in/,
    );
  });

  it("reduced-motion overrides .animate-skeleton-pulse to opacity: 0.6", () => {
    expect(rawCss).toMatch(
      /prefers-reduced-motion\s*:\s*reduce[\s\S]*?\.animate-skeleton-pulse[\s\S]*?opacity\s*:\s*0\.6/,
    );
  });
});

// ---------------------------------------------------------------------------
// Additional: Link styles (AC-BASE-28 to AC-BASE-30)
// ---------------------------------------------------------------------------

describe("Link styles (a)", () => {
  it("globals.css contains an `a` selector rule in @layer base", () => {
    // Look for `a` rule in the base layer block
    expect(rawCss).toMatch(/\ba\s*\{/);
  });

  it("a rule uses color: var(--color-primary)", () => {
    expect(rawCss).toMatch(/\ba\b\s*\{[^}]*color\s*:\s*var\(--color-primary\)/s);
  });

  it("a rule sets text-decoration: underline", () => {
    expect(rawCss).toMatch(/\ba\b\s*\{[^}]*text-decoration\s*:\s*underline/s);
  });

  it("a rule sets text-underline-offset: 2px", () => {
    expect(rawCss).toMatch(/\ba\b\s*\{[^}]*text-underline-offset\s*:\s*2px/s);
  });

  it("a rule sets text-decoration-color using --color-primary at 0.4 opacity", () => {
    expect(rawCss).toMatch(
      /\ba\b\s*\{[^}]*text-decoration-color\s*:\s*color-mix\(in srgb,\s*var\(--color-primary\)\s*40%,\s*transparent\)/s,
    );
  });
});

// ---------------------------------------------------------------------------
// Additional: Selection styles (AC-BASE-42 to AC-BASE-44)
// ---------------------------------------------------------------------------

describe("Selection styles (::selection)", () => {
  it("globals.css contains ::selection rule", () => {
    expect(rawCss).toMatch(/::selection\s*\{/);
  });

  it("::selection uses background-color with --color-primary at 0.15 opacity", () => {
    expect(rawCss).toMatch(
      /::selection\s*\{[^}]*background-color\s*:\s*color-mix\(in srgb,\s*var\(--color-primary\)\s*15%,\s*transparent\)/s,
    );
  });

  it("::selection uses color: var(--color-foreground)", () => {
    expect(rawCss).toMatch(/::selection\s*\{[^}]*color\s*:\s*var\(--color-foreground\)/s);
  });
});

// ---------------------------------------------------------------------------
// Additional: Code / Pre styles (AC-BASE-31 to AC-BASE-34)
// ---------------------------------------------------------------------------

describe("Code and pre styles", () => {
  it("globals.css contains code rule", () => {
    expect(rawCss).toMatch(/\bcode\b\s*\{/);
  });

  it("code rule uses font-family: var(--font-mono)", () => {
    expect(rawCss).toMatch(/\bcode\b\s*\{[^}]*font-family\s*:\s*var\(--font-mono\)/s);
  });

  it("code rule sets background-color using --color-muted", () => {
    expect(rawCss).toMatch(/\bcode\b\s*\{[^}]*background-color\s*:[^}]*--color-muted/s);
  });

  it("code rule sets border-radius using --radius-sm", () => {
    expect(rawCss).toMatch(/\bcode\b\s*\{[^}]*border-radius\s*:\s*var\(--radius-sm\)/s);
  });

  it("globals.css contains pre rule", () => {
    expect(rawCss).toMatch(/\bpre\b\s*\{/);
  });

  it("pre rule uses font-family: var(--font-mono)", () => {
    expect(rawCss).toMatch(/\bpre\b\s*\{[^}]*font-family\s*:\s*var\(--font-mono\)/s);
  });

  it("pre rule uses font-size: var(--text-sm)", () => {
    expect(rawCss).toMatch(/\bpre\b\s*\{[^}]*font-size\s*:\s*var\(--text-sm\)/s);
  });

  it("pre rule sets background-color using --color-muted", () => {
    expect(rawCss).toMatch(/\bpre\b\s*\{[^}]*background-color\s*:\s*var\(--color-muted\)/s);
  });

  it("globals.css contains pre code reset rule (transparent background)", () => {
    expect(rawCss).toMatch(/pre\s+code\s*\{[^}]*background-color\s*:\s*transparent/s);
  });

  it("pre code reset removes padding", () => {
    expect(rawCss).toMatch(/pre\s+code\s*\{[^}]*padding\s*:\s*0/s);
  });
});
