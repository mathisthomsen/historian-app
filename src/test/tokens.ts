/**
 * CSS token validation utility.
 *
 * Works in the jsdom Vitest environment by injecting the globals.css content
 * into a <style> tag so that CSS custom properties defined in @theme and .dark
 * blocks are readable via getComputedStyle.
 *
 * Note: Tailwind v4's @theme block is syntactic sugar that Tailwind processes
 * at build time into :root { } rules. In the raw CSS file, @theme is not a
 * standard CSS at-rule that jsdom evaluates. This utility therefore parses the
 * CSS text directly using regex and injects the token definitions into a real
 * :root rule so jsdom CSSStyleDeclaration reflects them.
 *
 * For contrast ratio testing at the token level, use parseTokens() to obtain
 * the raw HSL channel strings, then pass them to contrastRatio().
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ---------------------------------------------------------------------------
// File path
// ---------------------------------------------------------------------------

const GLOBALS_CSS_PATH = resolve(process.cwd(), "src/styles/globals.css");

// ---------------------------------------------------------------------------
// Token parsing
// ---------------------------------------------------------------------------

/**
 * Extract all CSS custom property declarations from a block of CSS text.
 * Looks for patterns like:  --my-token: value;
 * Returns a Map of { tokenName -> rawValue }.
 */
function extractTokensFromBlock(block: string): Map<string, string> {
  const map = new Map<string, string>();
  // Match --token-name: value; (value may include spaces, parens, commas, etc.)
  const re = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(block)) !== null) {
    const name = match[1]!.trim();
    const raw = match[2]!.trim();
    // Normalize: strip hsl() wrapper if present so callers get bare HSL channels.
    // The CSS now stores --color-* as hsl(H S% L%) for Tailwind v4 compatibility.
    const value = raw.replace(/^hsl\(([^)]+)\)$/, "$1");
    map.set(name, value);
  }
  return map;
}

/**
 * Parse the globals.css file and return separate token maps for light mode
 * (@theme block) and dark mode (.dark block).
 *
 * Also returns the raw CSS string for downstream analysis.
 */
export function parseTokens(): {
  light: Map<string, string>;
  dark: Map<string, string>;
  rawCss: string;
} {
  const css = readFileSync(GLOBALS_CSS_PATH, "utf-8");

  // Extract @theme { ... } block
  const themeMatch = /@theme\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/s.exec(css);
  const themeBlock = themeMatch ? (themeMatch[1] ?? "") : "";

  // Extract .dark { ... } block
  const darkMatch = /\.dark\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/s.exec(css);
  const darkBlock = darkMatch ? (darkMatch[1] ?? "") : "";

  return {
    light: extractTokensFromBlock(themeBlock),
    dark: extractTokensFromBlock(darkBlock),
    rawCss: css,
  };
}

// ---------------------------------------------------------------------------
// jsdom injection helpers
// ---------------------------------------------------------------------------

let injectedStyleEl: HTMLStyleElement | null = null;

/**
 * Inject all design system tokens into a <style> tag on document.head so
 * jsdom's getComputedStyle can resolve them.
 *
 * Light tokens go into :root { }
 * Dark tokens go into .dark { }
 *
 * Call this once in a beforeAll() or at the top of your test file.
 */
export function injectTokensIntoDocument(): void {
  const { light, dark } = parseTokens();

  let css = ":root {\n";
  for (const [name, value] of light) {
    css += `  ${name}: ${value};\n`;
  }
  css += "}\n\n";

  css += ".dark {\n";
  for (const [name, value] of dark) {
    css += `  ${name}: ${value};\n`;
  }
  css += "}\n";

  if (injectedStyleEl) {
    injectedStyleEl.textContent = css;
  } else {
    injectedStyleEl = document.createElement("style");
    injectedStyleEl.textContent = css;
    document.head.appendChild(injectedStyleEl);
  }
}

/**
 * Remove the injected style element. Call in afterAll() if needed.
 */
export function removeInjectedTokens(): void {
  if (injectedStyleEl) {
    injectedStyleEl.remove();
    injectedStyleEl = null;
  }
}

// ---------------------------------------------------------------------------
// Live DOM token readers (require injectTokensIntoDocument to have been called)
// ---------------------------------------------------------------------------

/**
 * Read a CSS custom property from :root via getComputedStyle.
 * Returns empty string if the token is not defined.
 */
export function getTokenValue(tokenName: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim();
}

/**
 * Read a CSS custom property in dark mode.
 * Temporarily adds .dark to documentElement to activate dark-mode rules.
 */
export function getDarkTokenValue(tokenName: string): string {
  document.documentElement.classList.add("dark");
  const value = getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim();
  document.documentElement.classList.remove("dark");
  return value;
}

// ---------------------------------------------------------------------------
// Assertion helpers
// ---------------------------------------------------------------------------

/**
 * Assert that a token exists and is non-empty. Throws with a descriptive
 * message if it is missing or empty, so the test failure is actionable.
 */
export function assertTokenExists(tokenName: string): void {
  const value = getTokenValue(tokenName);
  if (!value) {
    throw new Error(
      `Design system token "${tokenName}" is missing or empty in :root. ` +
        `Call injectTokensIntoDocument() in beforeAll() first.`,
    );
  }
}

/**
 * Assert that all tokens in the list exist and are non-empty.
 * Reports ALL missing tokens at once rather than stopping at the first.
 */
export function assertTokensComplete(tokenNames: string[]): void {
  const missing: string[] = [];
  for (const name of tokenNames) {
    const value = getTokenValue(name);
    if (!value) {
      missing.push(name);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `The following design system tokens are missing or empty:\n` +
        missing.map((n) => `  - ${n}`).join("\n"),
    );
  }
}

// ---------------------------------------------------------------------------
// Required token lists (sourced from globals.css @theme and .dark blocks)
// ---------------------------------------------------------------------------

/** Core surface and brand color tokens that must exist in light mode. */
export const REQUIRED_COLOR_TOKENS_LIGHT = [
  "--color-background",
  "--color-foreground",
  "--color-card",
  "--color-card-foreground",
  "--color-popover",
  "--color-popover-foreground",
  "--color-primary",
  "--color-primary-foreground",
  "--color-secondary",
  "--color-secondary-foreground",
  "--color-muted",
  "--color-muted-foreground",
  "--color-accent",
  "--color-accent-foreground",
  "--color-border",
  "--color-input",
  "--color-input-border",
  "--color-ring",
] as const;

/** Semantic color tokens (destructive, success, warning, info) — light mode. */
export const REQUIRED_SEMANTIC_TOKENS_LIGHT = [
  "--color-destructive",
  "--color-destructive-foreground",
  "--color-destructive-background",
  "--color-destructive-border",
  "--color-success",
  "--color-success-foreground",
  "--color-success-background",
  "--color-success-border",
  "--color-warning",
  "--color-warning-foreground",
  "--color-warning-background",
  "--color-warning-border",
  "--color-info",
  "--color-info-foreground",
  "--color-info-background",
  "--color-info-border",
] as const;

/** Certainty color tokens (all five levels, four variants each) — light mode. */
export const REQUIRED_CERTAINTY_TOKENS_LIGHT = [
  "--color-certainty-certain",
  "--color-certainty-certain-foreground",
  "--color-certainty-certain-background",
  "--color-certainty-certain-border",
  "--color-certainty-probable",
  "--color-certainty-probable-foreground",
  "--color-certainty-probable-background",
  "--color-certainty-probable-border",
  "--color-certainty-possible",
  "--color-certainty-possible-foreground",
  "--color-certainty-possible-background",
  "--color-certainty-possible-border",
  "--color-certainty-unknown",
  "--color-certainty-unknown-foreground",
  "--color-certainty-unknown-background",
  "--color-certainty-unknown-border",
  "--color-certainty-unevidenced",
  "--color-certainty-unevidenced-foreground",
  "--color-certainty-unevidenced-background",
  "--color-certainty-unevidenced-border",
] as const;

/** Sidebar color tokens. */
export const REQUIRED_SIDEBAR_TOKENS = [
  "--color-sidebar",
  "--color-sidebar-foreground",
  "--color-sidebar-border",
  "--color-sidebar-accent",
  "--color-sidebar-accent-foreground",
  "--color-sidebar-ring",
] as const;

/** Typography scale tokens. */
export const REQUIRED_TYPOGRAPHY_TOKENS = [
  "--text-xs",
  "--text-sm",
  "--text-base",
  "--text-lg",
  "--text-xl",
  "--text-2xl",
  "--text-3xl",
  "--text-4xl",
] as const;

/** Border radius scale tokens. */
export const REQUIRED_RADIUS_TOKENS = [
  "--radius",
  "--radius-none",
  "--radius-sm",
  "--radius-md",
  "--radius-lg",
  "--radius-xl",
  "--radius-full",
] as const;

/** Motion duration tokens. */
export const REQUIRED_DURATION_TOKENS = [
  "--duration-instant",
  "--duration-fast",
  "--duration-normal",
  "--duration-slow",
  "--duration-deliberate",
] as const;

/** Motion easing function tokens. */
export const REQUIRED_EASING_TOKENS = [
  "--ease-enter",
  "--ease-exit",
  "--ease-move",
  "--ease-spring",
  "--ease-out",
  "--ease-in",
  "--ease-in-out",
] as const;

/** Layout dimension tokens. */
export const REQUIRED_LAYOUT_TOKENS = [
  "--sidebar-width-open",
  "--sidebar-width-collapsed",
  "--topbar-height",
  "--content-max-width",
] as const;

/** Shadow scale tokens (only defined in @theme / :root for light mode). */
export const REQUIRED_SHADOW_TOKENS = ["--shadow-sm", "--shadow-md", "--shadow-lg"] as const;

/** All required tokens combined — used for completeness assertion. */
export const ALL_REQUIRED_TOKENS: readonly string[] = [
  ...REQUIRED_COLOR_TOKENS_LIGHT,
  ...REQUIRED_SEMANTIC_TOKENS_LIGHT,
  ...REQUIRED_CERTAINTY_TOKENS_LIGHT,
  ...REQUIRED_SIDEBAR_TOKENS,
  ...REQUIRED_TYPOGRAPHY_TOKENS,
  ...REQUIRED_RADIUS_TOKENS,
  ...REQUIRED_DURATION_TOKENS,
  ...REQUIRED_EASING_TOKENS,
  ...REQUIRED_LAYOUT_TOKENS,
  ...REQUIRED_SHADOW_TOKENS,
];

// ---------------------------------------------------------------------------
// Contrast ratio utility (works purely on raw HSL channel strings — no DOM)
// ---------------------------------------------------------------------------

function hslChannelsToLinearRgb(hslChannels: string): [number, number, number] {
  const parts = hslChannels.trim().split(/\s+/);
  if (parts.length < 3) {
    throw new Error(`Invalid HSL channels: "${hslChannels}"`);
  }
  const h = parseFloat(parts[0]!) / 360;
  const s = parseFloat(parts[1]!) / 100;
  const l = parseFloat(parts[2]!) / 100;

  if (s === 0) {
    const lin = lineariseChannel(l);
    return [lin, lin, lin];
  }

  function hue2rgb(p: number, q: number, t: number): number {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return [
    lineariseChannel(hue2rgb(p, q, h + 1 / 3)),
    lineariseChannel(hue2rgb(p, q, h)),
    lineariseChannel(hue2rgb(p, q, h - 1 / 3)),
  ];
}

function lineariseChannel(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Compute WCAG contrast ratio between two HSL channel strings.
 * Both strings must be in the Evidoxa token format: "H S% L%" (no hsl() wrapper).
 *
 * @returns ratio in the range 1–21
 */
export function contrastRatio(fg: string, bg: string): number {
  const [fr, fg2, fb] = hslChannelsToLinearRgb(fg);
  const [br, bg2, bb] = hslChannelsToLinearRgb(bg);
  const L1 = relativeLuminance(fr, fg2, fb);
  const L2 = relativeLuminance(br, bg2, bb);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Returns true if the contrast ratio between fg and bg meets the given
 * WCAG threshold.
 *
 * @param threshold - 3 (UI components, large text), 4.5 (AA), or 7 (AAA)
 */
export function meetsContrast(fg: string, bg: string, threshold: 3 | 4.5 | 7): boolean {
  return contrastRatio(fg, bg) >= threshold;
}
