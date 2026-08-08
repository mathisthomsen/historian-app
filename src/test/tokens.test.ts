/**
 * Design System Token Tests
 *
 * Encodes the acceptance criteria from:
 *   docs/implementation/01-tokens/token-spec.md
 *
 * Test IDs follow the convention: TC-DS-TOK-{NN}
 *
 * Uses src/test/tokens.ts helpers to parse globals.css, inject tokens into
 * jsdom, and compute WCAG contrast ratios without a real browser.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  ALL_REQUIRED_TOKENS,
  REQUIRED_CERTAINTY_TOKENS_LIGHT,
  REQUIRED_COLOR_TOKENS_LIGHT,
  REQUIRED_DURATION_TOKENS,
  REQUIRED_EASING_TOKENS,
  REQUIRED_LAYOUT_TOKENS,
  REQUIRED_RADIUS_TOKENS,
  REQUIRED_SEMANTIC_TOKENS_LIGHT,
  REQUIRED_SHADOW_TOKENS,
  REQUIRED_SIDEBAR_TOKENS,
  REQUIRED_TYPOGRAPHY_TOKENS,
  assertTokensComplete,
  contrastRatio,
  getDarkTokenValue,
  getTokenValue,
  injectTokensIntoDocument,
  parseTokens,
  removeInjectedTokens,
} from "./tokens";

// ---------------------------------------------------------------------------
// One-time DOM injection so getComputedStyle can see all tokens
// ---------------------------------------------------------------------------

beforeAll(() => {
  injectTokensIntoDocument();
});

afterAll(() => {
  removeInjectedTokens();
});

// ---------------------------------------------------------------------------
// TC-DS-TOK-01: Token presence — light mode
// ---------------------------------------------------------------------------

describe("TC-DS-TOK-01: Token presence — light mode", () => {
  it("all core color tokens are present", () => {
    assertTokensComplete([...REQUIRED_COLOR_TOKENS_LIGHT]);
  });

  it("all semantic color tokens are present", () => {
    assertTokensComplete([...REQUIRED_SEMANTIC_TOKENS_LIGHT]);
  });

  it("all certainty color tokens are present", () => {
    assertTokensComplete([...REQUIRED_CERTAINTY_TOKENS_LIGHT]);
  });

  it("all sidebar color tokens are present", () => {
    assertTokensComplete([...REQUIRED_SIDEBAR_TOKENS]);
  });

  it("all typography scale tokens are present", () => {
    assertTokensComplete([...REQUIRED_TYPOGRAPHY_TOKENS]);
  });

  it("all border radius tokens are present", () => {
    assertTokensComplete([...REQUIRED_RADIUS_TOKENS]);
  });

  it("all motion duration tokens are present", () => {
    assertTokensComplete([...REQUIRED_DURATION_TOKENS]);
  });

  it("all motion easing tokens are present", () => {
    assertTokensComplete([...REQUIRED_EASING_TOKENS]);
  });

  it("all layout dimension tokens are present", () => {
    assertTokensComplete([...REQUIRED_LAYOUT_TOKENS]);
  });

  it("all shadow tokens are present", () => {
    assertTokensComplete([...REQUIRED_SHADOW_TOKENS]);
  });

  it("complete token set covers all required tokens", () => {
    assertTokensComplete([...ALL_REQUIRED_TOKENS]);
  });
});

// ---------------------------------------------------------------------------
// TC-DS-TOK-02: Token presence — dark mode
// ---------------------------------------------------------------------------

describe("TC-DS-TOK-02: Token presence — dark mode", () => {
  /**
   * Dark mode overrides live in the .dark {} block. The parseTokens() utility
   * returns only the tokens that are explicitly overridden there. We check the
   * essential set that MUST have dark overrides per the spec (Section 1.4:
   * all --color-* and --shadow-* tokens).
   */

  // Helper: read via DOM (adds .dark class temporarily)
  function assertDarkTokensComplete(names: readonly string[]): void {
    const missing: string[] = [];
    for (const name of names) {
      const val = getDarkTokenValue(name);
      if (!val) missing.push(name);
    }
    if (missing.length > 0) {
      throw new Error(
        `The following dark-mode tokens are missing or empty:\n` +
          missing.map((n) => `  - ${n}`).join("\n"),
      );
    }
  }

  it("surface color tokens have dark overrides", () => {
    assertDarkTokensComplete([
      "--color-background",
      "--color-foreground",
      "--color-card",
      "--color-card-foreground",
      "--color-popover",
      "--color-popover-foreground",
    ]);
  });

  it("brand color tokens have dark overrides", () => {
    assertDarkTokensComplete([
      "--color-primary",
      "--color-primary-foreground",
      "--color-secondary",
      "--color-secondary-foreground",
      "--color-muted",
      "--color-muted-foreground",
      "--color-accent",
      "--color-accent-foreground",
    ]);
  });

  it("border and input tokens have dark overrides", () => {
    assertDarkTokensComplete([
      "--color-border",
      "--color-input",
      "--color-input-border",
      "--color-ring",
    ]);
  });

  it("semantic color tokens have dark overrides", () => {
    assertDarkTokensComplete([...REQUIRED_SEMANTIC_TOKENS_LIGHT]);
  });

  it("certainty color tokens have dark overrides", () => {
    assertDarkTokensComplete([...REQUIRED_CERTAINTY_TOKENS_LIGHT]);
  });

  it("sidebar tokens have dark overrides", () => {
    assertDarkTokensComplete([...REQUIRED_SIDEBAR_TOKENS]);
  });

  it("shadow tokens have dark overrides", () => {
    assertDarkTokensComplete([...REQUIRED_SHADOW_TOKENS]);
  });

  it("dark block exists and contains tokens", () => {
    const { dark } = parseTokens();
    expect(dark.size).toBeGreaterThan(0);
  });

  // Non-color tokens must NOT have dark overrides (they are mode-invariant)
  it("radius tokens do NOT have dark overrides (they are mode-invariant)", () => {
    const { dark } = parseTokens();
    for (const name of REQUIRED_RADIUS_TOKENS) {
      expect(
        dark.has(name),
        `${name} should not appear in .dark {} — radius is mode-invariant`,
      ).toBe(false);
    }
  });

  it("duration tokens do NOT have dark overrides (they are mode-invariant)", () => {
    const { dark } = parseTokens();
    for (const name of REQUIRED_DURATION_TOKENS) {
      expect(
        dark.has(name),
        `${name} should not appear in .dark {} — duration is mode-invariant`,
      ).toBe(false);
    }
  });

  it("easing tokens do NOT have dark overrides (they are mode-invariant)", () => {
    const { dark } = parseTokens();
    for (const name of REQUIRED_EASING_TOKENS) {
      expect(
        dark.has(name),
        `${name} should not appear in .dark {} — easing is mode-invariant`,
      ).toBe(false);
    }
  });

  it("layout tokens do NOT have dark overrides (they are mode-invariant)", () => {
    const { dark } = parseTokens();
    for (const name of REQUIRED_LAYOUT_TOKENS) {
      expect(
        dark.has(name),
        `${name} should not appear in .dark {} — layout dimensions are mode-invariant`,
      ).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// TC-DS-TOK-03: Critical token values — light mode
// ---------------------------------------------------------------------------

describe("TC-DS-TOK-03: Critical token values — light mode", () => {
  it("--color-background is the warm off-white (36 25% 98.5%)", () => {
    expect(getTokenValue("--color-background")).toBe("36 25% 98.5%");
  });

  it("--color-foreground is the warm near-black (20 14% 9%)", () => {
    expect(getTokenValue("--color-foreground")).toBe("20 14% 9%");
  });

  it("--color-primary is Archival Indigo (245 40% 36%)", () => {
    expect(getTokenValue("--color-primary")).toBe("245 40% 36%");
  });

  it("--color-muted-foreground is the warm secondary label color (26 10% 38%)", () => {
    expect(getTokenValue("--color-muted-foreground")).toBe("26 10% 38%");
  });

  it("--color-input-border is the higher-contrast form border (30 14% 55%)", () => {
    expect(getTokenValue("--color-input-border")).toBe("30 14% 55%");
  });

  it("--color-certainty-unevidenced is the desaturated warm grey (20 15% 40%)", () => {
    expect(getTokenValue("--color-certainty-unevidenced")).toBe("20 15% 40%");
  });

  it("--color-border is the subtle structural border (30 14% 88%)", () => {
    expect(getTokenValue("--color-border")).toBe("30 14% 88%");
  });

  it("--radius is the shadcn canonical 0.5rem", () => {
    expect(getTokenValue("--radius")).toBe("0.5rem");
  });

  it("--duration-fast is 100ms", () => {
    expect(getTokenValue("--duration-fast")).toBe("100ms");
  });

  it("--duration-normal is 200ms", () => {
    expect(getTokenValue("--duration-normal")).toBe("200ms");
  });

  it("--sidebar-width-open is 14rem (224px)", () => {
    expect(getTokenValue("--sidebar-width-open")).toBe("14rem");
  });

  it("--topbar-height is 3.5rem (56px)", () => {
    expect(getTokenValue("--topbar-height")).toBe("3.5rem");
  });

  it("--color-destructive is Iron Oxide red-brown (4 60% 46%)", () => {
    expect(getTokenValue("--color-destructive")).toBe("4 60% 46%");
  });

  it("--color-certainty-certain is cool teal (180 50% 30%)", () => {
    expect(getTokenValue("--color-certainty-certain")).toBe("180 50% 30%");
  });

  it("--color-certainty-probable is manuscript blue (215 50% 38%)", () => {
    expect(getTokenValue("--color-certainty-probable")).toBe("215 50% 38%");
  });

  it("--color-certainty-possible is muted indigo-violet (265 35% 45%)", () => {
    expect(getTokenValue("--color-certainty-possible")).toBe("265 35% 45%");
  });

  it("--color-certainty-unknown is archival amber (38 65% 45%)", () => {
    expect(getTokenValue("--color-certainty-unknown")).toBe("38 65% 45%");
  });

  it("--color-primary-foreground is near-white for high contrast on primary (240 20% 98%)", () => {
    expect(getTokenValue("--color-primary-foreground")).toBe("240 20% 98%");
  });

  it("--color-ring matches primary in light mode (245 40% 36%)", () => {
    expect(getTokenValue("--color-ring")).toBe("245 40% 36%");
  });

  it("--sidebar-width-collapsed is 3rem (48px)", () => {
    expect(getTokenValue("--sidebar-width-collapsed")).toBe("3rem");
  });

  it("--content-max-width is 80rem (1280px)", () => {
    expect(getTokenValue("--content-max-width")).toBe("80rem");
  });

  it("--duration-instant is 0ms", () => {
    expect(getTokenValue("--duration-instant")).toBe("0ms");
  });

  it("--duration-slow is 300ms", () => {
    expect(getTokenValue("--duration-slow")).toBe("300ms");
  });

  it("--duration-deliberate is 500ms", () => {
    expect(getTokenValue("--duration-deliberate")).toBe("500ms");
  });
});

// ---------------------------------------------------------------------------
// TC-DS-TOK-04: Critical token values — dark mode
// ---------------------------------------------------------------------------

describe("TC-DS-TOK-04: Critical token values — dark mode", () => {
  it("--color-primary lightens in dark mode to maintain contrast (245 40% 68%)", () => {
    expect(getDarkTokenValue("--color-primary")).toBe("245 40% 68%");
  });

  it("--color-muted-foreground in dark mode is readable warm grey (22 5% 55%)", () => {
    expect(getDarkTokenValue("--color-muted-foreground")).toBe("22 5% 55%");
  });

  it("--color-input-border in dark mode has sufficient UI component contrast (22 7% 40%)", () => {
    expect(getDarkTokenValue("--color-input-border")).toBe("22 7% 40%");
  });

  it("--color-certainty-unevidenced in dark mode is lightened warm grey (20 12% 56%)", () => {
    expect(getDarkTokenValue("--color-certainty-unevidenced")).toBe("20 12% 56%");
  });

  it("--color-border in dark mode is a dark warm tone (22 7% 18%)", () => {
    expect(getDarkTokenValue("--color-border")).toBe("22 7% 18%");
  });

  it("--color-background in dark mode is deep warm charcoal (25 10% 4.5%)", () => {
    expect(getDarkTokenValue("--color-background")).toBe("25 10% 4.5%");
  });

  it("--color-foreground in dark mode is warm cream (30 10% 94%)", () => {
    expect(getDarkTokenValue("--color-foreground")).toBe("30 10% 94%");
  });

  it("--color-ring in dark mode matches primary (245 40% 68%)", () => {
    expect(getDarkTokenValue("--color-ring")).toBe("245 40% 68%");
  });

  it("--color-destructive in dark mode is lightened red-brown (4 55% 58%)", () => {
    expect(getDarkTokenValue("--color-destructive")).toBe("4 55% 58%");
  });
});

// ---------------------------------------------------------------------------
// TC-DS-TOK-05: Contrast ratios — light mode
// ---------------------------------------------------------------------------

describe("TC-DS-TOK-05: Contrast ratios — light mode", () => {
  /**
   * We use the raw HSL channel strings from parseTokens() (light map) so
   * contrast is computed purely mathematically, without browser rendering.
   */

  let light: Map<string, string>;

  beforeAll(() => {
    ({ light } = parseTokens());
  });

  function get(name: string): string {
    const val = light.get(name);
    if (!val) throw new Error(`Light token "${name}" not found in globals.css`);
    return val;
  }

  it("foreground on background meets AAA (≥7.0)", () => {
    const ratio = contrastRatio(get("--color-foreground"), get("--color-background"));
    expect(ratio).toBeGreaterThanOrEqual(7.0);
  });

  it("muted-foreground on background meets AA (≥4.5)", () => {
    const ratio = contrastRatio(get("--color-muted-foreground"), get("--color-background"));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("muted-foreground on muted meets AA (≥4.5)", () => {
    const ratio = contrastRatio(get("--color-muted-foreground"), get("--color-muted"));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("primary on background meets AA for text/icon use (≥4.5)", () => {
    const ratio = contrastRatio(get("--color-primary"), get("--color-background"));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("primary-foreground on primary meets AA (≥4.5)", () => {
    const ratio = contrastRatio(get("--color-primary-foreground"), get("--color-primary"));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("certainty-certain on background meets ≥3.0 (non-text contrast indicator)", () => {
    const ratio = contrastRatio(get("--color-certainty-certain"), get("--color-background"));
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });

  it("certainty-unevidenced on background meets ≥4.5 (text/icon use)", () => {
    const ratio = contrastRatio(get("--color-certainty-unevidenced"), get("--color-background"));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("input-border on background meets WCAG 1.4.11 UI component threshold (≥3.0)", () => {
    const ratio = contrastRatio(get("--color-input-border"), get("--color-background"));
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });

  it("destructive on background meets AA (≥4.5)", () => {
    const ratio = contrastRatio(get("--color-destructive"), get("--color-background"));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("certainty-certain-foreground on certainty-certain-background meets AA (≥4.5)", () => {
    const ratio = contrastRatio(
      get("--color-certainty-certain-foreground"),
      get("--color-certainty-certain-background"),
    );
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("certainty-unevidenced-foreground on certainty-unevidenced-background meets AA (≥4.5)", () => {
    const ratio = contrastRatio(
      get("--color-certainty-unevidenced-foreground"),
      get("--color-certainty-unevidenced-background"),
    );
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("certainty-probable on background meets ≥3.0", () => {
    const ratio = contrastRatio(get("--color-certainty-probable"), get("--color-background"));
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });

  it("certainty-possible on background meets ≥3.0", () => {
    const ratio = contrastRatio(get("--color-certainty-possible"), get("--color-background"));
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });

  it("certainty-unknown on background meets ≥3.0", () => {
    const ratio = contrastRatio(get("--color-certainty-unknown"), get("--color-background"));
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });
});

// ---------------------------------------------------------------------------
// TC-DS-TOK-06: Contrast ratios — dark mode
// ---------------------------------------------------------------------------

describe("TC-DS-TOK-06: Contrast ratios — dark mode", () => {
  let dark: Map<string, string>;
  // Light map is needed for tokens without dark overrides (none expected here,
  // but kept for safety)
  let light: Map<string, string>;

  beforeAll(() => {
    ({ dark, light } = parseTokens());
  });

  function getDark(name: string): string {
    // Prefer dark override; fall back to light value for tokens without overrides
    const val = dark.get(name) ?? light.get(name);
    if (!val) throw new Error(`Token "${name}" not found in globals.css (dark or light)`);
    return val;
  }

  it("foreground on background meets AAA in dark mode (≥7.0)", () => {
    const ratio = contrastRatio(getDark("--color-foreground"), getDark("--color-background"));
    expect(ratio).toBeGreaterThanOrEqual(7.0);
  });

  it("muted-foreground on background meets AA in dark mode (≥4.5)", () => {
    const ratio = contrastRatio(getDark("--color-muted-foreground"), getDark("--color-background"));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("muted-foreground on muted meets AA in dark mode (≥4.5)", () => {
    const ratio = contrastRatio(getDark("--color-muted-foreground"), getDark("--color-muted"));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("primary-foreground on primary meets AA in dark mode (≥4.5)", () => {
    const ratio = contrastRatio(getDark("--color-primary-foreground"), getDark("--color-primary"));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("certainty-certain on background meets ≥3.0 in dark mode", () => {
    const ratio = contrastRatio(
      getDark("--color-certainty-certain"),
      getDark("--color-background"),
    );
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });

  it("certainty-unevidenced on background meets ≥4.5 in dark mode", () => {
    const ratio = contrastRatio(
      getDark("--color-certainty-unevidenced"),
      getDark("--color-background"),
    );
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("input-border on background meets WCAG 1.4.11 in dark mode (≥3.0)", () => {
    const ratio = contrastRatio(getDark("--color-input-border"), getDark("--color-background"));
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });

  it("destructive on background meets AA in dark mode (≥4.5)", () => {
    const ratio = contrastRatio(getDark("--color-destructive"), getDark("--color-background"));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("certainty-certain-foreground on certainty-certain-background meets AA in dark mode (≥4.5)", () => {
    const ratio = contrastRatio(
      getDark("--color-certainty-certain-foreground"),
      getDark("--color-certainty-certain-background"),
    );
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("certainty-unevidenced-foreground on certainty-unevidenced-background meets AA in dark mode (≥4.5)", () => {
    const ratio = contrastRatio(
      getDark("--color-certainty-unevidenced-foreground"),
      getDark("--color-certainty-unevidenced-background"),
    );
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("certainty-probable on background meets ≥3.0 in dark mode", () => {
    const ratio = contrastRatio(
      getDark("--color-certainty-probable"),
      getDark("--color-background"),
    );
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });

  it("certainty-possible on background meets ≥3.0 in dark mode", () => {
    const ratio = contrastRatio(
      getDark("--color-certainty-possible"),
      getDark("--color-background"),
    );
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });

  it("certainty-unknown on background meets ≥3.0 in dark mode", () => {
    const ratio = contrastRatio(
      getDark("--color-certainty-unknown"),
      getDark("--color-background"),
    );
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });
});

// ---------------------------------------------------------------------------
// TC-DS-TOK-07: Token format hygiene
// ---------------------------------------------------------------------------

describe("TC-DS-TOK-07: Token format hygiene", () => {
  let light: Map<string, string>;
  let dark: Map<string, string>;
  let rawCss: string;

  beforeAll(() => {
    ({ light, dark, rawCss } = parseTokens());
  });

  it("no color token value in light mode contains hsl( — bare channels only", () => {
    const violations: string[] = [];
    for (const [name, value] of light) {
      if (name.startsWith("--color-") && value.includes("hsl(")) {
        violations.push(`${name}: ${value}`);
      }
    }
    expect(
      violations,
      `Color token values must not include hsl() wrapper. Violations:\n${violations.join("\n")}`,
    ).toHaveLength(0);
  });

  it("no color token value in dark mode contains hsl( — bare channels only", () => {
    const violations: string[] = [];
    for (const [name, value] of dark) {
      if (name.startsWith("--color-") && value.includes("hsl(")) {
        violations.push(`${name}: ${value}`);
      }
    }
    expect(
      violations,
      `Dark-mode color token values must not include hsl() wrapper. Violations:\n${violations.join("\n")}`,
    ).toHaveLength(0);
  });

  it("--color-background does not reference zinc or slate (not a shadcn scaffold default)", () => {
    // Check both light and dark blocks as text
    const bgLight = light.get("--color-background") ?? "";
    const bgDark = dark.get("--color-background") ?? "";
    expect(bgLight).not.toMatch(/zinc|slate/i);
    expect(bgDark).not.toMatch(/zinc|slate/i);
  });

  it("--color-background light value is not shadcn default white (0 0% 100% or 0 0% 100%)", () => {
    // shadcn new-project scaffold: background is typically "0 0% 100%" (pure white)
    // Evidoxa uses warm off-white "36 25% 98.5%"
    const val = light.get("--color-background") ?? "";
    expect(val).not.toBe("0 0% 100%");
  });

  it("--color-primary is not the shadcn default blue (222.2 47.4% 11.2% or 221.2 83.2% 53.3%)", () => {
    // shadcn generates primary as these values for new projects
    const val = light.get("--color-primary") ?? "";
    expect(val).not.toBe("222.2 47.4% 11.2%");
    expect(val).not.toBe("221.2 83.2% 53.3%");
    // The actual Evidoxa indigo:
    expect(val).toBe("245 40% 36%");
  });

  it("all color token names follow --color-{semantic-group} convention (no bare --background etc.)", () => {
    // shadcn v3 used bare names like --background; v4 Evidoxa uses --color-background
    // If any token named exactly --background exists it would be a scaffold leak
    const v3Names = [
      "--background",
      "--foreground",
      "--primary",
      "--primary-foreground",
      "--secondary",
      "--secondary-foreground",
      "--muted",
      "--muted-foreground",
      "--accent",
      "--accent-foreground",
      "--destructive",
      "--destructive-foreground",
      "--border",
      "--input",
      "--ring",
      "--card",
      "--card-foreground",
      "--popover",
      "--popover-foreground",
    ];
    const found: string[] = [];
    for (const name of v3Names) {
      if (light.has(name)) found.push(`light: ${name}`);
      if (dark.has(name)) found.push(`dark: ${name}`);
    }
    expect(
      found,
      `shadcn v3 naming pattern detected — use --color-* prefix:\n${found.join("\n")}`,
    ).toHaveLength(0);
  });

  it("token values do not contain named CSS colors (e.g. 'red', 'blue', 'white', 'black')", () => {
    const namedColors =
      /\b(red|blue|green|white|black|gray|grey|yellow|purple|orange|pink|teal)\b/i;
    const colorViolations: string[] = [];
    for (const [name, value] of light) {
      if (name.startsWith("--color-") && namedColors.test(value)) {
        colorViolations.push(`light ${name}: ${value}`);
      }
    }
    for (const [name, value] of dark) {
      if (name.startsWith("--color-") && namedColors.test(value)) {
        colorViolations.push(`dark ${name}: ${value}`);
      }
    }
    expect(
      colorViolations,
      `Color token values must use HSL channels, not named CSS colors:\n${colorViolations.join("\n")}`,
    ).toHaveLength(0);
  });

  it("@theme block exists in globals.css (tokens are not defined elsewhere)", () => {
    expect(rawCss).toMatch(/@theme\s*\{/);
  });

  it(".dark block exists in globals.css for dark overrides", () => {
    expect(rawCss).toMatch(/\.dark\s*\{/);
  });

  it("no --color-* token is defined outside @theme or .dark blocks", () => {
    // Strip @theme { ... } and .dark { ... } content, then check for stray --color- defs
    const withoutTheme = rawCss.replace(/@theme\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/s, "");
    const withoutDark = withoutTheme.replace(/\.dark\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}/s, "");
    // Should not find any --color- token assignments in remaining CSS
    const strayMatch = /--color-[\w-]+\s*:\s*[^;]+;/.exec(withoutDark);
    expect(
      strayMatch,
      strayMatch
        ? `Stray color token found outside @theme or .dark: "${strayMatch[0]}"`
        : undefined,
    ).toBeNull();
  });

  it("light mode has more tokens than dark mode (non-color tokens are light-only)", () => {
    // Non-color tokens (radius, duration, easing, layout, typography) are only in @theme
    // so light should always have more entries than dark
    const { light: l, dark: d } = parseTokens();
    expect(l.size).toBeGreaterThan(d.size);
  });
});
