/**
 * Design system test helpers for Vitest (jsdom environment).
 *
 * These helpers operate on document.documentElement CSS custom properties.
 * jsdom does not compute full CSS layout, but it DOES support inline style
 * property reads from getComputedStyle when styles are set via JavaScript.
 * Token assertions therefore work against values set directly on the element
 * or via a <style> tag injected at test time.
 */

// ---------------------------------------------------------------------------
// CSS custom property readers
// ---------------------------------------------------------------------------

/**
 * Read a CSS custom property value from a given element.
 * Returns the trimmed string value, or empty string if not set.
 */
export function getComputedToken(el: Element, tokenName: string): string {
  return getComputedStyle(el).getPropertyValue(tokenName).trim();
}

/**
 * Read a CSS custom property value from :root (document.documentElement).
 */
export function getRootToken(tokenName: string): string {
  return getComputedToken(document.documentElement, tokenName);
}

/**
 * Read a CSS custom property value in dark mode.
 * Temporarily adds `.dark` to documentElement, reads the value, then removes it.
 */
export function getDarkToken(tokenName: string): string {
  document.documentElement.classList.add("dark");
  const value = getComputedToken(document.documentElement, tokenName);
  document.documentElement.classList.remove("dark");
  return value;
}

// ---------------------------------------------------------------------------
// Contrast ratio helpers
// ---------------------------------------------------------------------------

/**
 * Convert a single HSL channel string (e.g. "245 40% 36%") to an [r, g, b]
 * array in the 0-1 range suitable for luminance calculation.
 *
 * The input format matches the Evidoxa token convention: HSL channels WITHOUT
 * an hsl() wrapper (e.g. `--color-primary: 245 40% 36%`).
 */
function hslChannelsToRgb(hslChannels: string): [number, number, number] {
  const parts = hslChannels.trim().split(/\s+/);
  if (parts.length < 3) {
    throw new Error(`Invalid HSL channels string: "${hslChannels}". Expected "H S% L%".`);
  }
  const h = parseFloat(parts[0]!) / 360;
  const s = parseFloat(parts[1]!) / 100;
  const l = parseFloat(parts[2]!) / 100;

  if (s === 0) {
    return [l, l, l];
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

  return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
}

/**
 * Compute relative luminance from a linearised sRGB channel value.
 * Per WCAG 2.x formula.
 */
function linearise(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Compute the WCAG contrast ratio between two HSL channel strings.
 *
 * @param foreground - HSL channels string, e.g. "245 40% 36%"
 * @param background - HSL channels string, e.g. "36 25% 98.5%"
 * @returns WCAG contrast ratio (1–21)
 */
export function checkContrast(foreground: string, background: string): number {
  const [fr, fg, fb] = hslChannelsToRgb(foreground);
  const [br, bg, bb] = hslChannelsToRgb(background);

  const L1 = 0.2126 * linearise(fr) + 0.7152 * linearise(fg) + 0.0722 * linearise(fb);
  const L2 = 0.2126 * linearise(br) + 0.7152 * linearise(bg) + 0.0722 * linearise(bb);

  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);

  return (lighter + 0.05) / (darker + 0.05);
}

// ---------------------------------------------------------------------------
// Theme helpers
// ---------------------------------------------------------------------------

/**
 * Run a test function with `.dark` class applied to documentElement.
 * Cleans up after the function regardless of success or failure.
 */
export async function withDarkMode(fn: () => void | Promise<void>): Promise<void> {
  document.documentElement.classList.add("dark");
  try {
    await fn();
  } finally {
    document.documentElement.classList.remove("dark");
  }
}

// ---------------------------------------------------------------------------
// Motion helpers
// ---------------------------------------------------------------------------

/**
 * Run a test function with a mock that simulates `prefers-reduced-motion: reduce`.
 * Patches window.matchMedia to return `matches: true` for the reduced-motion
 * query, then restores the original implementation afterward.
 */
export async function withReducedMotion(fn: () => void | Promise<void>): Promise<void> {
  const original = window.matchMedia;

  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });

  try {
    await fn();
  } finally {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: original,
    });
  }
}
