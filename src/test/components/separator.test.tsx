/**
 * Separator component tests
 * Spec: docs/implementation/03-components/separator-spec.md
 *
 * Tests cover:
 * - Visual/token: bg-border class, orientation sizing classes
 * - Accessibility: ARIA role, aria-orientation, decorative handling
 * - Composition: className merge
 */

import { render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it } from "vitest";

import { Separator } from "@/components/ui/separator";

// ---------------------------------------------------------------------------
// AC-SEP-01: bg-border token class
// ---------------------------------------------------------------------------

describe("Separator — token class", () => {
  it("AC-SEP-01: renders with bg-border class", () => {
    const { container } = render(<Separator />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("bg-border");
  });
});

// ---------------------------------------------------------------------------
// AC-SEP-02 / AC-SEP-04: horizontal orientation (default)
// ---------------------------------------------------------------------------

describe("Separator — horizontal orientation", () => {
  it("AC-SEP-04: default orientation is horizontal", () => {
    const { container } = render(<Separator />);
    const el = container.firstChild as HTMLElement;
    // horizontal sizing: h-[1px] and w-full
    expect(el.className).toMatch(/h-\[1px\]|h-px/);
    expect(el.className).toContain("w-full");
  });

  it("AC-SEP-02: explicit horizontal orientation applies h-[1px] and w-full", () => {
    const { container } = render(<Separator orientation="horizontal" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/h-\[1px\]|h-px/);
    expect(el.className).toContain("w-full");
  });

  it("AC-SEP-02: horizontal separator does not apply h-full", () => {
    const { container } = render(<Separator orientation="horizontal" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).not.toContain("h-full");
  });
});

// ---------------------------------------------------------------------------
// AC-SEP-03: vertical orientation
// ---------------------------------------------------------------------------

describe("Separator — vertical orientation", () => {
  it("AC-SEP-03: vertical orientation applies w-[1px] and h-full", () => {
    const { container } = render(<Separator orientation="vertical" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toMatch(/w-\[1px\]|w-px/);
    expect(el.className).toContain("h-full");
  });

  it("AC-SEP-03: vertical separator does not apply w-full", () => {
    const { container } = render(<Separator orientation="vertical" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).not.toContain("w-full");
  });
});

// ---------------------------------------------------------------------------
// AC-SEP-05 / AC-SEP-06: ARIA attributes — non-decorative
// ---------------------------------------------------------------------------

describe("Separator — ARIA (non-decorative)", () => {
  it("AC-SEP-05: non-decorative separator has role=separator", () => {
    render(<Separator decorative={false} />);
    const el = screen.getByRole("separator");
    expect(el).toBeInTheDocument();
  });

  it("AC-SEP-06: non-decorative horizontal separator does not set aria-orientation (horizontal is the implicit ARIA default)", () => {
    render(<Separator decorative={false} orientation="horizontal" />);
    const el = screen.getByRole("separator");
    // Per ARIA spec, horizontal is the default orientation for role=separator.
    // Radix correctly omits aria-orientation for horizontal to avoid redundancy.
    // The element should NOT have aria-orientation="vertical".
    expect(el).not.toHaveAttribute("aria-orientation", "vertical");
    // And the data-orientation attribute reflects the actual orientation
    expect(el).toHaveAttribute("data-orientation", "horizontal");
  });

  it("AC-SEP-06: non-decorative vertical separator has aria-orientation=vertical", () => {
    render(<Separator decorative={false} orientation="vertical" />);
    const el = screen.getByRole("separator");
    expect(el).toHaveAttribute("aria-orientation", "vertical");
  });
});

// ---------------------------------------------------------------------------
// AC-SEP-07: decorative separator is hidden from AT
// ---------------------------------------------------------------------------

describe("Separator — decorative (default)", () => {
  it("AC-SEP-07: decorative separator is not exposed as role=separator", () => {
    const { container } = render(<Separator decorative={true} />);
    // Radix sets role="none" on decorative separators
    const el = container.firstChild as HTMLElement;
    const role = el.getAttribute("role");
    // Either role is "none" or absent — either way not "separator"
    expect(role).not.toBe("separator");
  });
});

// ---------------------------------------------------------------------------
// AC-SEP-08: className merge
// ---------------------------------------------------------------------------

describe("Separator — className merge", () => {
  it("AC-SEP-08: merges extra className with base classes", () => {
    const { container } = render(<Separator className="my-4" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("my-4");
    expect(el.className).toContain("bg-border");
  });
});
