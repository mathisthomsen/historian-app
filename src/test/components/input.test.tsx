/**
 * Input component — design system implementation tests.
 *
 * Spec: docs/implementation/03-components/input-spec.md
 *
 * Coverage:
 *   - AC-INPUT-01: Border uses `border-input-border` (WCAG token fix)
 *   - AC-INPUT-02: Height h-10 (40px touch target)
 *   - AC-INPUT-03: Typography (text-sm, text-foreground, placeholder:text-muted-foreground)
 *   - AC-INPUT-04: Focus ring classes (ring-2, ring-ring, ring-offset-2)
 *   - AC-INPUT-05: Disabled state (opacity-50, cursor-not-allowed)
 *   - AC-INPUT-06: Background (bg-transparent)
 *   - AC-INPUT-07: Border radius (rounded-md)
 *   - AC-INPUT-08: aria-invalid attribute respected
 *   - AC-INPUT-09: Transition classes present
 *   - AC-INPUT-10: Accessibility (axe-core)
 *   - AC-INPUT-11: --color-input-border token present in both themes
 *
 * Run: pnpm vitest run src/test/components/input.test.tsx
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeAll } from "vitest";
import { axe } from "vitest-axe";

import { Input } from "@/components/ui/input";

import { injectTokensIntoDocument, getTokenValue, getDarkTokenValue } from "../tokens";

// ---------------------------------------------------------------------------
// Setup: inject design-system tokens into jsdom so CSS custom properties are
// readable via getComputedStyle. Required for token-level assertions.
// ---------------------------------------------------------------------------

beforeAll(() => {
  injectTokensIntoDocument();
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function getInputClasses(container: HTMLElement): string {
  const input = container.querySelector("input");
  if (!input) throw new Error("No <input> found in container");
  return input.className;
}

// ---------------------------------------------------------------------------
// AC-INPUT-01: Border token — must be `border-input-border` not `border-input`
// ---------------------------------------------------------------------------

describe("AC-INPUT-01: border token", () => {
  it("renders with border-input-border class (WCAG-compliant token)", () => {
    const { container } = render(<Input />);
    const classes = getInputClasses(container);
    expect(classes).toContain("border-input-border");
  });

  it("does NOT use the low-contrast border-input class as the border token", () => {
    const { container } = render(<Input />);
    const classes = getInputClasses(container);
    // border-input-border contains the string "border-input" as a substring,
    // so we check there is no standalone `border-input` word (not followed by -border)
    // The class list should NOT have exactly "border-input" as a space-separated token.
    const classList = classes.split(/\s+/);
    expect(classList).not.toContain("border-input");
  });
});

// ---------------------------------------------------------------------------
// AC-INPUT-02: Height — h-10 for 40px touch target
// ---------------------------------------------------------------------------

describe("AC-INPUT-02: height touch target", () => {
  it("has h-10 class (40px minimum touch target)", () => {
    const { container } = render(<Input />);
    const classes = getInputClasses(container);
    expect(classes).toContain("h-10");
  });

  it("does NOT have h-9 (36px is insufficient for touch targets)", () => {
    const { container } = render(<Input />);
    const classList = getInputClasses(container).split(/\s+/);
    expect(classList).not.toContain("h-9");
  });
});

// ---------------------------------------------------------------------------
// AC-INPUT-03: Typography
// ---------------------------------------------------------------------------

describe("AC-INPUT-03: typography", () => {
  it("has text-sm class (14px body text)", () => {
    const { container } = render(<Input />);
    expect(getInputClasses(container)).toContain("text-sm");
  });

  it("has text-foreground class", () => {
    const { container } = render(<Input />);
    expect(getInputClasses(container)).toContain("text-foreground");
  });

  it("has placeholder:text-muted-foreground class", () => {
    const { container } = render(<Input placeholder="Search..." />);
    expect(getInputClasses(container)).toContain("placeholder:text-muted-foreground");
  });
});

// ---------------------------------------------------------------------------
// AC-INPUT-04: Focus ring
// ---------------------------------------------------------------------------

describe("AC-INPUT-04: focus ring", () => {
  it("has focus-visible:outline-none", () => {
    const { container } = render(<Input />);
    expect(getInputClasses(container)).toContain("focus-visible:outline-none");
  });

  it("has focus-visible:ring-2", () => {
    const { container } = render(<Input />);
    expect(getInputClasses(container)).toContain("focus-visible:ring-2");
  });

  it("has focus-visible:ring-ring", () => {
    const { container } = render(<Input />);
    expect(getInputClasses(container)).toContain("focus-visible:ring-ring");
  });

  it("has focus-visible:ring-offset-2", () => {
    const { container } = render(<Input />);
    expect(getInputClasses(container)).toContain("focus-visible:ring-offset-2");
  });

  it("does NOT use ring-1 (insufficient for WCAG 2.4.11)", () => {
    const { container } = render(<Input />);
    const classList = getInputClasses(container).split(/\s+/);
    expect(classList).not.toContain("focus-visible:ring-1");
  });
});

// ---------------------------------------------------------------------------
// AC-INPUT-05: Disabled state
// ---------------------------------------------------------------------------

describe("AC-INPUT-05: disabled state", () => {
  it("has disabled:cursor-not-allowed class", () => {
    const { container } = render(<Input disabled />);
    expect(getInputClasses(container)).toContain("disabled:cursor-not-allowed");
  });

  it("has disabled:opacity-50 class", () => {
    const { container } = render(<Input disabled />);
    expect(getInputClasses(container)).toContain("disabled:opacity-50");
  });

  it("is not focusable via keyboard when disabled (native behavior)", () => {
    render(<Input disabled data-testid="disabled-input" />);
    const input = screen.getByTestId("disabled-input");
    expect(input).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// AC-INPUT-06: Background
// ---------------------------------------------------------------------------

describe("AC-INPUT-06: background", () => {
  it("has bg-transparent class in default state", () => {
    const { container } = render(<Input />);
    expect(getInputClasses(container)).toContain("bg-transparent");
  });
});

// ---------------------------------------------------------------------------
// AC-INPUT-07: Border radius
// ---------------------------------------------------------------------------

describe("AC-INPUT-07: border radius", () => {
  it("has rounded-md class (--radius-md, 6px)", () => {
    const { container } = render(<Input />);
    expect(getInputClasses(container)).toContain("rounded-md");
  });
});

// ---------------------------------------------------------------------------
// AC-INPUT-08: aria-invalid
// ---------------------------------------------------------------------------

describe("AC-INPUT-08: aria-invalid for error state", () => {
  it("renders aria-invalid=true when provided", () => {
    render(<Input aria-invalid="true" data-testid="invalid-input" />);
    const input = screen.getByTestId("invalid-input");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("does not render aria-invalid when not provided", () => {
    render(<Input data-testid="valid-input" />);
    const input = screen.getByTestId("valid-input");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("merges error className via className prop", () => {
    const { container } = render(
      <Input className="border-destructive focus-visible:ring-destructive" />,
    );
    const classes = getInputClasses(container);
    expect(classes).toContain("border-destructive");
    expect(classes).toContain("focus-visible:ring-destructive");
  });
});

// ---------------------------------------------------------------------------
// AC-INPUT-09: Transition
// ---------------------------------------------------------------------------

describe("AC-INPUT-09: transition classes", () => {
  it("has transition-colors class", () => {
    const { container } = render(<Input />);
    expect(getInputClasses(container)).toContain("transition-colors");
  });

  it("has duration-[var(--duration-fast)] class for 100ms transition", () => {
    const { container } = render(<Input />);
    expect(getInputClasses(container)).toContain("duration-[var(--duration-fast)]");
  });
});

// ---------------------------------------------------------------------------
// AC-INPUT-10: Accessibility (axe-core)
// ---------------------------------------------------------------------------

describe("AC-INPUT-10: axe-core accessibility", () => {
  it("labeled input has no axe violations", async () => {
    const { container } = render(
      <div>
        <label htmlFor="test-name">Full name</label>
        <Input id="test-name" type="text" />
      </div>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("disabled labeled input has no axe violations", async () => {
    const { container } = render(
      <div>
        <label htmlFor="test-disabled">Disabled field</label>
        <Input id="test-disabled" disabled />
      </div>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("error state input with describedby has no axe violations", async () => {
    const { container } = render(
      <div>
        <label htmlFor="test-error">Name</label>
        <Input
          id="test-error"
          aria-invalid="true"
          aria-describedby="test-error-msg"
          className="border-destructive"
        />
        <p id="test-error-msg" className="text-destructive text-xs">
          This field is required.
        </p>
      </div>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ---------------------------------------------------------------------------
// AC-INPUT-11: --color-input-border token (both themes)
// ---------------------------------------------------------------------------

describe("AC-INPUT-11: --color-input-border token in both themes", () => {
  it("--color-input-border is present and non-empty in light mode", () => {
    const value = getTokenValue("--color-input-border");
    expect(value).toBeTruthy();
    expect(value).not.toBe("");
  });

  it("--color-input-border is present and non-empty in dark mode", () => {
    const value = getDarkTokenValue("--color-input-border");
    expect(value).toBeTruthy();
    expect(value).not.toBe("");
  });

  it("light and dark --color-input-border values are different", () => {
    const light = getTokenValue("--color-input-border");
    const dark = getDarkTokenValue("--color-input-border");
    expect(light).not.toBe(dark);
  });

  it("light --color-input-border contains 55% lightness (3.5:1 contrast on background)", () => {
    const value = getTokenValue("--color-input-border");
    // Light value: 30 14% 55%
    expect(value).toMatch(/55%/);
  });

  it("dark --color-input-border contains 40% lightness (3.2:1 contrast on dark background)", () => {
    const value = getDarkTokenValue("--color-input-border");
    // Dark value: 22 7% 40%
    expect(value).toMatch(/40%/);
  });
});

// ---------------------------------------------------------------------------
// Additional: className merging
// ---------------------------------------------------------------------------

describe("className prop merging", () => {
  it("appends custom classes to base classes without losing base classes", () => {
    const { container } = render(<Input className="w-64 font-mono" />);
    const classes = getInputClasses(container);
    expect(classes).toContain("w-64");
    expect(classes).toContain("font-mono");
    // Base classes still present
    expect(classes).toContain("border-input-border");
    expect(classes).toContain("h-10");
  });
});
