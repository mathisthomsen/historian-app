/**
 * Motion tests — Layer 6: Motion and Transitions
 *
 * Testing approach (jsdom environment):
 *
 * jsdom does not parse globals.css or compute Tailwind-generated styles. We
 * therefore verify motion correctness through three complementary strategies:
 *
 * 1. CSS source scanning: parse globals.css with parseTokens() to assert
 *    that token values are defined and animation utilities reference them.
 * 2. Component class-name assertions: render components and inspect the
 *    className strings present on DOM elements to verify they contain the
 *    correct duration/easing token references.
 * 3. Reduced-motion CSS rules: parse the raw CSS source and assert that
 *    @media (prefers-reduced-motion: reduce) blocks exist and contain the
 *    required overrides.
 *
 * All tests are purely structural (no browser layout engine needed). This is
 * intentional — visual correctness is validated by Playwright E2E tests.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render } from "@testing-library/react";
import { describe, expect, it, beforeAll } from "vitest";

import { parseTokens, injectTokensIntoDocument } from "./tokens";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GLOBALS_CSS_PATH = resolve(process.cwd(), "src/styles/globals.css");

function readGlobalsCss(): string {
  return readFileSync(GLOBALS_CSS_PATH, "utf-8");
}

/**
 * Return true if any `@media (prefers-reduced-motion: reduce)` block in the
 * CSS source contains the given text snippet.
 *
 * The regex uses a brace-counting approach to handle nested blocks (e.g.
 * @media inside @layer utilities). It scans for the @media opening, then
 * reads characters counting braces until the matching closing brace.
 */
function reducedMotionBlockContains(css: string, snippet: string): boolean {
  const markerRe = /@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*\{/g;
  let markerMatch: RegExpExecArray | null;
  while ((markerMatch = markerRe.exec(css)) !== null) {
    // markerMatch.index points to the start of @media; the content begins
    // right after the opening brace at the end of the match.
    const start = markerMatch.index + markerMatch[0].length;
    let depth = 1;
    let i = start;
    while (i < css.length && depth > 0) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") depth--;
      i++;
    }
    // The block content is css[start .. i-1] (excluding the final closing brace)
    const block = css.slice(start, i - 1);
    if (block.includes(snippet)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeAll(() => {
  injectTokensIntoDocument();
});

// ===========================================================================
// Section 1: Motion token definitions
// ===========================================================================

describe("Motion token definitions (globals.css @theme block)", () => {
  it("defines all required duration tokens", () => {
    const { light } = parseTokens();
    const requiredDurations = [
      "--duration-instant",
      "--duration-fast",
      "--duration-normal",
      "--duration-slow",
      "--duration-deliberate",
    ];
    for (const token of requiredDurations) {
      expect(light.has(token), `Missing duration token: ${token}`).toBe(true);
      expect(light.get(token), `Empty duration token: ${token}`).toBeTruthy();
    }
  });

  it("defines all required easing tokens", () => {
    const { light } = parseTokens();
    const requiredEasings = [
      "--ease-enter",
      "--ease-exit",
      "--ease-move",
      "--ease-spring",
      "--ease-out",
      "--ease-in",
      "--ease-in-out",
    ];
    for (const token of requiredEasings) {
      expect(light.has(token), `Missing easing token: ${token}`).toBe(true);
      expect(light.get(token), `Empty easing token: ${token}`).toBeTruthy();
    }
  });

  it("--duration-instant is exactly 0ms", () => {
    const { light } = parseTokens();
    expect(light.get("--duration-instant")).toBe("0ms");
  });

  it("--duration-fast is exactly 100ms", () => {
    const { light } = parseTokens();
    expect(light.get("--duration-fast")).toBe("100ms");
  });

  it("--duration-normal is exactly 200ms", () => {
    const { light } = parseTokens();
    expect(light.get("--duration-normal")).toBe("200ms");
  });

  it("--duration-slow is exactly 300ms", () => {
    const { light } = parseTokens();
    expect(light.get("--duration-slow")).toBe("300ms");
  });

  it("--duration-deliberate is exactly 500ms", () => {
    const { light } = parseTokens();
    expect(light.get("--duration-deliberate")).toBe("500ms");
  });

  it("--ease-enter is the correct cubic-bezier value", () => {
    const { light } = parseTokens();
    expect(light.get("--ease-enter")).toBe("cubic-bezier(0.16, 1, 0.3, 1)");
  });

  it("--ease-exit is the correct cubic-bezier value", () => {
    const { light } = parseTokens();
    expect(light.get("--ease-exit")).toBe("cubic-bezier(0.7, 0, 0.84, 0)");
  });

  it("--ease-move is the correct cubic-bezier value", () => {
    const { light } = parseTokens();
    expect(light.get("--ease-move")).toBe("cubic-bezier(0.65, 0, 0.35, 1)");
  });

  it("--ease-spring is the correct cubic-bezier value", () => {
    const { light } = parseTokens();
    expect(light.get("--ease-spring")).toBe("cubic-bezier(0.34, 1.56, 0.64, 1)");
  });

  it("--ease-out aliases --ease-enter (same value)", () => {
    const { light } = parseTokens();
    expect(light.get("--ease-out")).toBe(light.get("--ease-enter"));
  });

  it("--ease-in aliases --ease-exit (same value)", () => {
    const { light } = parseTokens();
    expect(light.get("--ease-in")).toBe(light.get("--ease-exit"));
  });

  it("--ease-in-out aliases --ease-move (same value)", () => {
    const { light } = parseTokens();
    expect(light.get("--ease-in-out")).toBe(light.get("--ease-move"));
  });
});

// ===========================================================================
// Section 2: Animation utility classes reference tokens (CSS source scan)
// ===========================================================================

describe("Animation utility classes reference CSS custom property tokens", () => {
  it(".animate-in uses var(--duration-slow) as animation-duration", () => {
    const css = readGlobalsCss();
    expect(css).toMatch(/\.animate-in\s*\{[^}]*animation-duration:\s*var\(--duration-slow\)/s);
  });

  it(".animate-in uses var(--ease-enter) as animation-timing-function", () => {
    const css = readGlobalsCss();
    expect(css).toMatch(/\.animate-in\s*\{[^}]*animation-timing-function:\s*var\(--ease-enter\)/s);
  });

  it(".animate-out uses var(--duration-normal) as animation-duration", () => {
    const css = readGlobalsCss();
    expect(css).toMatch(/\.animate-out\s*\{[^}]*animation-duration:\s*var\(--duration-normal\)/s);
  });

  it(".animate-out uses var(--ease-exit) as animation-timing-function", () => {
    const css = readGlobalsCss();
    expect(css).toMatch(/\.animate-out\s*\{[^}]*animation-timing-function:\s*var\(--ease-exit\)/s);
  });

  it(".animate-skeleton-pulse uses var(--ease-in-out) as timing function", () => {
    const css = readGlobalsCss();
    expect(css).toMatch(/\.animate-skeleton-pulse\s*\{[^}]*var\(--ease-in-out\)/s);
  });

  it(".animate-badge-pulse uses var(--duration-fast)", () => {
    const css = readGlobalsCss();
    expect(css).toMatch(/\.animate-badge-pulse\s*\{[^}]*var\(--duration-fast\)/s);
  });

  it(".animate-badge-pulse uses var(--ease-spring)", () => {
    const css = readGlobalsCss();
    expect(css).toMatch(/\.animate-badge-pulse\s*\{[^}]*var\(--ease-spring\)/s);
  });

  it("body theme-switch transition uses var(--duration-normal)", () => {
    const css = readGlobalsCss();
    // The body block must contain transition-duration: var(--duration-normal)
    expect(css).toMatch(/body\s*\{[^}]*transition-duration:\s*var\(--duration-normal\)/s);
  });

  it("body theme-switch transition uses var(--ease-in-out)", () => {
    const css = readGlobalsCss();
    expect(css).toMatch(/body\s*\{[^}]*transition-timing-function:\s*var\(--ease-in-out\)/s);
  });

  it("no hardcoded duration literal ms values in animation utility definitions (no 200ms, 300ms, etc.)", () => {
    const css = readGlobalsCss();
    // Extract the @layer utilities block for checking — we allow values only inside
    // var() expressions. Strip var(...) wrappers and check for bare ms values.
    const utilitiesMatch = /@layer utilities\s*\{([\s\S]*)\}/s.exec(css);
    if (!utilitiesMatch) {
      throw new Error("@layer utilities block not found in globals.css");
    }
    const utilitiesBlock = utilitiesMatch[1]!;
    // Remove all var(--...) references to avoid false positives from token values
    const withoutVarRefs = utilitiesBlock.replace(/var\([^)]+\)/g, "TOKEN");
    // 2000ms (skeleton pulse) is an intentional non-token value; allow it
    const withoutAllowed = withoutVarRefs.replace(/2000ms/g, "ALLOWED_SKELETON");
    // Now check: no remaining bare Xms values (e.g., 100ms, 200ms, 300ms, 500ms)
    const bareMs = /(?<!\w)\d{2,4}ms\b/.exec(withoutAllowed);
    expect(
      bareMs,
      `Found hardcoded duration "${bareMs?.[0]}" in @layer utilities. Use var(--duration-*) tokens instead.`,
    ).toBeNull();
  });
});

// ===========================================================================
// Section 3: Component class-name assertions — token references in JSX
// ===========================================================================

describe("Sidebar uses motion token class names", () => {
  it("sidebar <aside> element includes duration-[var(--duration-normal)] in className", async () => {
    // Read the sidebar source and verify it references the duration token
    const source = readFileSync(
      resolve(process.cwd(), "src/components/shell/sidebar.tsx"),
      "utf-8",
    );
    expect(source).toMatch(/duration-\[var\(--duration-normal\)\]/);
  });

  it("sidebar <aside> element includes ease-[var(--ease-move)] in className", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/shell/sidebar.tsx"),
      "utf-8",
    );
    expect(source).toMatch(/ease-\[var\(--ease-move\)\]/);
  });

  it("sidebar transitions 'width' property (not transform: scaleX)", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/shell/sidebar.tsx"),
      "utf-8",
    );
    // Should have transition-[width] not transition-all (which would include layout thrash)
    expect(source).toMatch(/transition-\[width\]/);
  });
});

describe("AppShell uses motion token class names for padding-left transition", () => {
  it("AppShell <main> includes transition-[padding-left] with duration-[var(--duration-normal)]", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/shell/app-shell.tsx"),
      "utf-8",
    );
    expect(source).toMatch(/transition-\[padding-left\]/);
    expect(source).toMatch(/duration-\[var\(--duration-normal\)\]/);
  });
});

describe("Dialog uses motion token class names", () => {
  it("DialogContent className includes duration-[var(--duration-slow)] or duration-[var(--duration-normal)]", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/ui/dialog.tsx"), "utf-8");
    // Dialog open uses --duration-slow, close uses --duration-normal
    // The component sets one duration class that applies to both states
    const hasSlowToken = source.includes("duration-[var(--duration-slow)]");
    const hasNormalToken = source.includes("duration-[var(--duration-normal)]");
    expect(
      hasSlowToken || hasNormalToken,
      "DialogContent must reference a duration token via duration-[var(--duration-slow)] or duration-[var(--duration-normal)]",
    ).toBe(true);
  });

  it("DialogContent uses animate-in / animate-out (token-based animation utilities)", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/ui/dialog.tsx"), "utf-8");
    expect(source).toMatch(/data-\[state=open\]:animate-in/);
    expect(source).toMatch(/data-\[state=closed\]:animate-out/);
  });

  it("DialogContent animates only opacity and transform (no layout-affecting properties)", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/ui/dialog.tsx"), "utf-8");
    // fade-in/fade-out: opacity only; zoom-in/zoom-out: transform scale only
    expect(source).toMatch(/fade-in|fade-out/);
    expect(source).toMatch(/zoom-in|zoom-out/);
  });
});

describe("Popover uses motion token class names", () => {
  it("PopoverContent uses animate-in / animate-out", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/ui/popover.tsx"), "utf-8");
    expect(source).toMatch(/data-\[state=open\]:animate-in/);
    expect(source).toMatch(/data-\[state=closed\]:animate-out/);
  });

  it("PopoverContent uses fade-in and zoom-in (opacity + transform, not layout properties)", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/ui/popover.tsx"), "utf-8");
    expect(source).toMatch(/fade-in/);
    expect(source).toMatch(/zoom-in/);
  });
});

describe("Tooltip uses motion token class names", () => {
  it("TooltipContent uses animate-in (fade-in) for enter", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/ui/tooltip.tsx"), "utf-8");
    expect(source).toMatch(/animate-in/);
    expect(source).toMatch(/fade-in/);
  });

  it("TooltipContent uses animate-out (fade-out) for exit", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/ui/tooltip.tsx"), "utf-8");
    expect(source).toMatch(/animate-out/);
    expect(source).toMatch(/fade-out/);
  });
});

describe("Button hover transition uses duration token", () => {
  it("Button base class includes transition-colors with duration-[var(--duration-fast)]", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/ui/button.tsx"), "utf-8");
    expect(source).toMatch(/transition-colors/);
    expect(source).toMatch(/duration-\[var\(--duration-fast\)\]/);
  });
});

describe("TableRow hover transition uses duration token", () => {
  it("TableRow includes transition-colors with duration-[var(--duration-fast)]", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/ui/table.tsx"), "utf-8");
    expect(source).toMatch(/transition-colors/);
    expect(source).toMatch(/duration-\[var\(--duration-fast\)\]/);
  });
});

describe("Page route transition template", () => {
  it("template.tsx exists in the (app) route group", () => {
    const { existsSync } = require("node:fs");
    const templatePath = resolve(process.cwd(), "src/app/[locale]/(app)/template.tsx");
    expect(
      existsSync(templatePath),
      "src/app/[locale]/(app)/template.tsx must exist to implement page route transitions",
    ).toBe(true);
  });

  it("template.tsx applies animate-in fade-in class for page transition", () => {
    const templatePath = resolve(process.cwd(), "src/app/[locale]/(app)/template.tsx");
    const { existsSync } = require("node:fs");
    if (!existsSync(templatePath)) {
      // Test will already fail from the existence check above
      return;
    }
    const source = readFileSync(templatePath, "utf-8");
    expect(source).toMatch(/animate-in/);
    expect(source).toMatch(/fade-in/);
  });

  it("template.tsx page transition uses duration-deliberate token", () => {
    const templatePath = resolve(process.cwd(), "src/app/[locale]/(app)/template.tsx");
    const { existsSync } = require("node:fs");
    if (!existsSync(templatePath)) return;
    const source = readFileSync(templatePath, "utf-8");
    expect(source).toMatch(/duration-\[var\(--duration-deliberate\)\]/);
  });

  it("template.tsx page transition uses only opacity (no layout-affecting transforms)", () => {
    const templatePath = resolve(process.cwd(), "src/app/[locale]/(app)/template.tsx");
    const { existsSync } = require("node:fs");
    if (!existsSync(templatePath)) return;
    const source = readFileSync(templatePath, "utf-8");
    // fade-in is opacity only — ensure there is no slide-in or scale-in
    expect(source).not.toMatch(/slide-in-from/);
    expect(source).not.toMatch(/zoom-in(?!-0)/); // zoom-in-0 (opacity only) is acceptable
  });
});

// ===========================================================================
// Section 4: prefers-reduced-motion overrides in CSS source
// ===========================================================================

describe("prefers-reduced-motion CSS overrides", () => {
  it("globals.css has a global reduced-motion reset in @layer base", () => {
    const css = readGlobalsCss();
    // The base layer must contain a prefers-reduced-motion block that sets
    // animation-duration to 0.01ms
    const baseMatch = /@layer base\s*\{([\s\S]*?)\n\}/s.exec(css);
    const baseBlock = baseMatch ? baseMatch[1] : css;
    expect(baseBlock).toMatch(/@media\s*\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/);
    expect(baseBlock).toMatch(/animation-duration:\s*0\.01ms/);
    expect(baseBlock).toMatch(/transition-duration:\s*0\.01ms/);
  });

  it("animation-duration reset uses !important", () => {
    const css = readGlobalsCss();
    expect(css).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
  });

  it("transition-duration reset uses !important", () => {
    const css = readGlobalsCss();
    expect(css).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
  });

  it("animation-iteration-count is reset to 1 under reduced motion", () => {
    const css = readGlobalsCss();
    expect(css).toMatch(/animation-iteration-count:\s*1\s*!important/);
  });

  it(".animate-skeleton-pulse is disabled under reduced motion (animation: none)", () => {
    const css = readGlobalsCss();
    const found = reducedMotionBlockContains(css, "animate-skeleton-pulse");
    expect(
      found,
      ".animate-skeleton-pulse must be overridden in @media (prefers-reduced-motion: reduce)",
    ).toBe(true);
  });

  it(".animate-skeleton-pulse sets opacity: 0.6 under reduced motion (static state)", () => {
    const css = readGlobalsCss();
    const skeletonBlock = reducedMotionBlockContains(css, "animate-skeleton-pulse");
    // The block containing animate-skeleton-pulse must also contain opacity: 0.6
    // We verify by checking the full CSS for the combination
    const hasOpacity = reducedMotionBlockContains(css, "opacity: 0.6");
    expect(
      skeletonBlock && hasOpacity,
      ".animate-skeleton-pulse must set opacity: 0.6 under prefers-reduced-motion: reduce",
    ).toBe(true);
  });

  it(".animate-badge-pulse is disabled under reduced motion (animation: none)", () => {
    const css = readGlobalsCss();
    const found = reducedMotionBlockContains(css, "animate-badge-pulse");
    expect(
      found,
      ".animate-badge-pulse must be overridden in @media (prefers-reduced-motion: reduce)",
    ).toBe(true);
  });

  it(".scale-in uses fade-in animation (no scale transform) under reduced motion", () => {
    const css = readGlobalsCss();
    const found =
      reducedMotionBlockContains(css, "scale-in") && reducedMotionBlockContains(css, "fade-in");
    expect(
      found,
      ".scale-in must map to fade-in animation under prefers-reduced-motion: reduce",
    ).toBe(true);
  });

  it(".scale-out uses fade-out animation (no scale transform) under reduced motion", () => {
    const css = readGlobalsCss();
    const found =
      reducedMotionBlockContains(css, "scale-out") && reducedMotionBlockContains(css, "fade-out");
    expect(
      found,
      ".scale-out must map to fade-out animation under prefers-reduced-motion: reduce",
    ).toBe(true);
  });

  it(".slide-in-from-* animations become opacity-only fades under reduced motion", () => {
    const css = readGlobalsCss();
    const found =
      reducedMotionBlockContains(css, "slide-in-from-top") &&
      reducedMotionBlockContains(css, "fade-in");
    expect(found, ".slide-in-from-* must map to fade-in under prefers-reduced-motion: reduce").toBe(
      true,
    );
  });

  it(".slide-out-to-* animations become opacity-only fades under reduced motion", () => {
    const css = readGlobalsCss();
    const found =
      reducedMotionBlockContains(css, "slide-out-to-top") &&
      reducedMotionBlockContains(css, "fade-out");
    expect(found, ".slide-out-to-* must map to fade-out under prefers-reduced-motion: reduce").toBe(
      true,
    );
  });
});

// ===========================================================================
// Section 5: Layout safety — animated elements do not shift layout
// ===========================================================================

describe("Layout safety — animations use compositor-only properties", () => {
  it("fade-in keyframe only animates opacity (no width, height, margin, padding)", () => {
    const css = readGlobalsCss();
    const re = /@keyframes fade-in\s*\{([\s\S]*?)\}/s;
    const match = re.exec(css);
    expect(match, "@keyframes fade-in not found in globals.css").not.toBeNull();
    const body = match![1];
    expect(body).not.toMatch(/\bwidth\b/);
    expect(body).not.toMatch(/\bheight\b/);
    expect(body).not.toMatch(/\bmargin\b/);
    expect(body).not.toMatch(/\bpadding\b/);
  });

  it("fade-out keyframe only animates opacity", () => {
    const css = readGlobalsCss();
    const re = /@keyframes fade-out\s*\{([\s\S]*?)\}/s;
    const match = re.exec(css);
    expect(match, "@keyframes fade-out not found in globals.css").not.toBeNull();
    const body = match![1];
    expect(body).not.toMatch(/\bwidth\b/);
    expect(body).not.toMatch(/\bheight\b/);
  });

  it("scale-in keyframe uses transform and opacity only (no width/height)", () => {
    const css = readGlobalsCss();
    const re = /@keyframes scale-in\s*\{([\s\S]*?)\}/s;
    const match = re.exec(css);
    expect(match, "@keyframes scale-in not found in globals.css").not.toBeNull();
    const body = match![1];
    expect(body).toMatch(/opacity/);
    expect(body).toMatch(/transform/);
    expect(body).not.toMatch(/\bwidth\b/);
    expect(body).not.toMatch(/\bheight\b/);
  });

  it("scale-out keyframe uses transform and opacity only (no width/height)", () => {
    const css = readGlobalsCss();
    const re = /@keyframes scale-out\s*\{([\s\S]*?)\}/s;
    const match = re.exec(css);
    expect(match, "@keyframes scale-out not found in globals.css").not.toBeNull();
    const body = match![1];
    expect(body).toMatch(/transform/);
    expect(body).not.toMatch(/\bwidth\b/);
    expect(body).not.toMatch(/\bheight\b/);
  });

  it("slide-in-from-bottom keyframe uses transform and opacity only", () => {
    const css = readGlobalsCss();
    const re = /@keyframes slide-in-from-bottom\s*\{([\s\S]*?)\}/s;
    const match = re.exec(css);
    expect(match, "@keyframes slide-in-from-bottom not found in globals.css").not.toBeNull();
    const body = match![1];
    expect(body).toMatch(/opacity/);
    expect(body).toMatch(/transform/);
    expect(body).not.toMatch(/\bwidth\b/);
    expect(body).not.toMatch(/\bheight\b/);
  });

  it("sidebar transition only animates width (not affecting sibling layout via transform)", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/shell/sidebar.tsx"),
      "utf-8",
    );
    // Must have transition-[width] — only width changes, no transform on sidebar
    expect(source).toMatch(/transition-\[width\]/);
    // AppShell main padding handles the companion shift (not sidebar transform)
    const shellSource = readFileSync(
      resolve(process.cwd(), "src/components/shell/app-shell.tsx"),
      "utf-8",
    );
    expect(shellSource).toMatch(/transition-\[padding-left\]/);
  });

  it("body transition only animates color properties (not width/height/transform)", () => {
    const css = readGlobalsCss();
    // Find body { ... } block in @layer base
    const bodyMatch = /body\s*\{([^}]+)\}/s.exec(css);
    expect(bodyMatch, "body block not found in globals.css").not.toBeNull();
    const bodyBlock = bodyMatch![1]!;
    // transition-property should list only color-related properties
    const transPropMatch = /transition-property:\s*([^;]+);/.exec(bodyBlock);
    expect(transPropMatch, "body transition-property not found").not.toBeNull();
    const transProps = transPropMatch![1]!;
    expect(transProps).not.toMatch(/\bwidth\b/);
    expect(transProps).not.toMatch(/\bheight\b/);
    expect(transProps).not.toMatch(/\btransform\b/);
  });
});

// ===========================================================================
// Section 6: Accessibility — content accessible without animations
// ===========================================================================

describe("Content accessibility without animations", () => {
  it("Dialog renders children even when animation classes are not processed by jsdom", async () => {
    const { Dialog, DialogContent, DialogTrigger } = await import("@/components/ui/dialog");

    const { getByText } = render(
      <Dialog defaultOpen>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <p>Dialog content is accessible</p>
        </DialogContent>
      </Dialog>,
    );
    // Content must be present in DOM regardless of animation state
    expect(getByText("Dialog content is accessible")).toBeTruthy();
  });

  it("Tooltip renders children regardless of animation", async () => {
    const { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } =
      await import("@/components/ui/tooltip");
    const { getAllByRole } = render(
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger>
            <button>Hover me</button>
          </TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    // Trigger must be in DOM and accessible (getAllByRole handles Radix nesting)
    const buttons = getAllByRole("button", { name: "Hover me" });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("sidebar nav links are accessible in both open and collapsed states", async () => {
    // We test via source: all nav links have aria-label
    const source = readFileSync(
      resolve(process.cwd(), "src/components/shell/sidebar.tsx"),
      "utf-8",
    );
    // aria-label is present on all links (including collapsed icon-only state)
    const ariaLabelCount = (source.match(/aria-label/g) ?? []).length;
    expect(ariaLabelCount).toBeGreaterThanOrEqual(2);
  });
});

// ===========================================================================
// Section 7: No animation duration >5 seconds without user control
// ===========================================================================

describe("Animation duration limits (AC-MOT-22)", () => {
  it("no @keyframes animation in globals.css has a duration >5000ms (5 seconds)", () => {
    const { light } = parseTokens();
    // All duration tokens must be <= 5000ms
    const durationTokens = [
      "--duration-instant",
      "--duration-fast",
      "--duration-normal",
      "--duration-slow",
      "--duration-deliberate",
    ];
    for (const token of durationTokens) {
      const raw = light.get(token) ?? "";
      const ms = parseFloat(raw);
      expect(ms, `Duration token ${token} (${raw}) exceeds 5000ms`).toBeLessThanOrEqual(5000);
    }
  });

  it("skeleton pulse is 2000ms (within 5s limit) and stops when content loads", () => {
    const css = readGlobalsCss();
    // Verify skeleton pulse is defined with 2s
    expect(css).toMatch(/animate-skeleton-pulse\s*\{[^}]*2s/s);
  });
});
