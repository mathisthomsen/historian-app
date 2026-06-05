/**
 * Design system infrastructure smoke test.
 *
 * Verifies that:
 * 1. All required CSS tokens are parseable from globals.css
 * 2. Light-mode tokens are non-empty
 * 3. Dark-mode tokens are non-empty
 * 4. vitest-axe matchers are available on `expect`
 * 5. Motion tokens are present and have expected values
 *
 * This test uses parseTokens() directly against the raw CSS file rather than
 * via jsdom injection, since the smoke test must be self-contained and not
 * depend on CSS being injected into the DOM. The token values come from
 * regex-parsing the globals.css file — this matches what the browser will
 * receive after Tailwind processes the file.
 *
 * Run: pnpm vitest run src/test/design-system-smoke.test.ts
 */

import { describe, expect, it, beforeAll } from "vitest";

import {
  ALL_REQUIRED_TOKENS,
  REQUIRED_COLOR_TOKENS_LIGHT,
  REQUIRED_DURATION_TOKENS,
  REQUIRED_EASING_TOKENS,
  REQUIRED_RADIUS_TOKENS,
  REQUIRED_LAYOUT_TOKENS,
  parseTokens,
  injectTokensIntoDocument,
  getTokenValue,
  getDarkTokenValue,
} from "./tokens";

// ---------------------------------------------------------------------------
// Setup: inject tokens into jsdom once for this test suite
// ---------------------------------------------------------------------------

beforeAll(() => {
  injectTokensIntoDocument();
});

// ---------------------------------------------------------------------------
// 1. Token parsing — raw CSS parsing (no DOM dependency)
// ---------------------------------------------------------------------------

describe("DS-TOK-01: globals.css is parseable", () => {
  it("parseTokens returns non-empty light and dark maps", () => {
    const { light, dark } = parseTokens();
    expect(light.size).toBeGreaterThan(0);
    expect(dark.size).toBeGreaterThan(0);
  });

  it("light map contains all required color tokens", () => {
    const { light } = parseTokens();
    const missing = REQUIRED_COLOR_TOKENS_LIGHT.filter(
      (name) => !light.has(name) || !light.get(name),
    );
    expect(missing, `Missing light-mode tokens: ${missing.join(", ")}`).toHaveLength(0);
  });

  it("dark map contains overrides for all core surface and brand tokens", () => {
    const { dark } = parseTokens();
    const coreTokens = [
      "--color-background",
      "--color-foreground",
      "--color-card",
      "--color-card-foreground",
      "--color-primary",
      "--color-primary-foreground",
      "--color-muted",
      "--color-muted-foreground",
      "--color-border",
      "--color-ring",
    ];
    const missing = coreTokens.filter((name) => !dark.has(name) || !dark.get(name));
    expect(missing, `Missing dark-mode overrides: ${missing.join(", ")}`).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 2. jsdom token reads — light mode
// ---------------------------------------------------------------------------

describe("DS-TOK-02: light mode tokens are readable via getComputedStyle", () => {
  it("all required tokens return non-empty values in :root", () => {
    const missing: string[] = [];
    for (const name of ALL_REQUIRED_TOKENS) {
      const value = getTokenValue(name);
      if (!value) {
        missing.push(name);
      }
    }
    expect(
      missing,
      `Tokens missing from :root (check injectTokensIntoDocument):\n${missing.map((n) => `  - ${n}`).join("\n")}`,
    ).toHaveLength(0);
  });

  it("--color-background is defined and non-empty", () => {
    expect(getTokenValue("--color-background")).not.toBe("");
  });

  it("--color-primary is the archival indigo value", () => {
    const value = getTokenValue("--color-primary");
    expect(value).toBeTruthy();
    // Light mode primary is archival indigo: 245 40% 36%
    expect(value).toMatch(/245/);
  });
});

// ---------------------------------------------------------------------------
// 3. jsdom token reads — dark mode
// ---------------------------------------------------------------------------

describe("DS-TOK-03: dark mode tokens are readable when .dark is active", () => {
  it("--color-background changes between light and dark", () => {
    const light = getTokenValue("--color-background");
    const dark = getDarkTokenValue("--color-background");
    expect(light).not.toBe("");
    expect(dark).not.toBe("");
    expect(light).not.toBe(dark);
  });

  it("--color-primary is lighter in dark mode", () => {
    const light = getTokenValue("--color-primary");
    const dark = getDarkTokenValue("--color-primary");
    // Dark mode primary lightens to 68% lightness vs 36% in light mode
    expect(dark).toMatch(/68%/);
    expect(light).toMatch(/36%/);
  });

  it("dark-mode tokens do not bleed into light mode after cleanup", () => {
    // getDarkTokenValue adds then removes .dark — verify cleanup
    getDarkTokenValue("--color-background");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. Motion tokens
// ---------------------------------------------------------------------------

describe("DS-TOK-04: motion tokens resolve correctly", () => {
  it("all duration tokens are present and non-empty", () => {
    const missing = REQUIRED_DURATION_TOKENS.filter((name) => !getTokenValue(name));
    expect(missing, `Missing duration tokens: ${missing.join(", ")}`).toHaveLength(0);
  });

  it("--duration-instant is 0ms", () => {
    expect(getTokenValue("--duration-instant")).toBe("0ms");
  });

  it("--duration-fast is 100ms", () => {
    expect(getTokenValue("--duration-fast")).toBe("100ms");
  });

  it("--duration-normal is 200ms", () => {
    expect(getTokenValue("--duration-normal")).toBe("200ms");
  });

  it("--duration-slow is 300ms", () => {
    expect(getTokenValue("--duration-slow")).toBe("300ms");
  });

  it("--duration-deliberate is 500ms", () => {
    expect(getTokenValue("--duration-deliberate")).toBe("500ms");
  });

  it("all easing function tokens are present and non-empty", () => {
    const missing = REQUIRED_EASING_TOKENS.filter((name) => !getTokenValue(name));
    expect(missing, `Missing easing tokens: ${missing.join(", ")}`).toHaveLength(0);
  });

  it("--ease-enter is a cubic-bezier value", () => {
    expect(getTokenValue("--ease-enter")).toMatch(/cubic-bezier/);
  });
});

// ---------------------------------------------------------------------------
// 5. Radius tokens
// ---------------------------------------------------------------------------

describe("DS-TOK-05: border radius tokens resolve correctly", () => {
  it("all radius tokens are present and non-empty", () => {
    const missing = REQUIRED_RADIUS_TOKENS.filter((name) => !getTokenValue(name));
    expect(missing, `Missing radius tokens: ${missing.join(", ")}`).toHaveLength(0);
  });

  it("--radius equals 0.5rem (shadcn canonical)", () => {
    expect(getTokenValue("--radius")).toBe("0.5rem");
  });

  it("--radius-full is 9999px", () => {
    expect(getTokenValue("--radius-full")).toBe("9999px");
  });
});

// ---------------------------------------------------------------------------
// 6. Layout tokens
// ---------------------------------------------------------------------------

describe("DS-TOK-06: layout dimension tokens resolve correctly", () => {
  it("all layout tokens are present and non-empty", () => {
    const missing = REQUIRED_LAYOUT_TOKENS.filter((name) => !getTokenValue(name));
    expect(missing, `Missing layout tokens: ${missing.join(", ")}`).toHaveLength(0);
  });

  it("--sidebar-width-open is 14rem", () => {
    expect(getTokenValue("--sidebar-width-open")).toBe("14rem");
  });

  it("--sidebar-width-collapsed is 3rem", () => {
    expect(getTokenValue("--sidebar-width-collapsed")).toBe("3rem");
  });

  it("--topbar-height is 3.5rem", () => {
    expect(getTokenValue("--topbar-height")).toBe("3.5rem");
  });
});

// ---------------------------------------------------------------------------
// 7. vitest-axe matchers are available
// ---------------------------------------------------------------------------

describe("DS-TOK-07: vitest-axe matchers are registered", () => {
  it("expect has toHaveNoViolations matcher from vitest-axe", () => {
    // If the matcher is missing, this will throw "expect(...).toHaveNoViolations is not a function"
    // We call it with a mock passing result to verify the matcher is wired up.
    const passingResult = { violations: [] };
    expect(passingResult).toHaveNoViolations();
  });

  it("toHaveNoViolations throws when violations are present", () => {
    const failingResult = {
      violations: [
        {
          id: "color-contrast",
          help: "Color contrast is insufficient",
          helpUrl: "https://dequeuniversity.com/rules/axe/4.11/color-contrast",
          impact: "serious",
          nodes: [
            {
              target: ["button"],
              html: "<button>Click</button>",
              failureSummary: "Fix any of the following: ...",
            },
          ],
        },
      ],
    };
    expect(() => expect(failingResult).toHaveNoViolations()).toThrow();
  });
});
