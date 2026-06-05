import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge, badgeVariants } from "@/components/ui/badge";

// Helper: render a badge and return the DOM element
function renderBadge(props: React.ComponentProps<typeof Badge> = {}) {
  const { container } = render(<Badge {...props} />);
  // Badge renders as a <div> by default (shadcn)
  return container.firstChild as HTMLElement;
}

// ---------------------------------------------------------------------------
// AC-BADGE-18: exported API
// ---------------------------------------------------------------------------
describe("exports", () => {
  it("exports badgeVariants as a function", () => {
    expect(typeof badgeVariants).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// AC-BADGE-14 / AC-BADGE-15: base classes present on every variant
// ---------------------------------------------------------------------------
describe("base classes", () => {
  it("includes rounded-full in base class string", () => {
    const el = renderBadge({ variant: "default", children: "test" });
    expect(el.className).toContain("rounded-full");
  });

  it("includes focus ring classes in base class string", () => {
    const el = renderBadge({ variant: "default", children: "test" });
    expect(el.className).toContain("focus:ring-2");
  });

  it("includes inline-flex in base class string", () => {
    const el = renderBadge({ variant: "default", children: "test" });
    expect(el.className).toContain("inline-flex");
  });
});

// ---------------------------------------------------------------------------
// AC-BADGE-17: children rendered
// ---------------------------------------------------------------------------
describe("children", () => {
  it("renders text children", () => {
    render(<Badge variant="default">Hello</Badge>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// AC-BADGE-19: arbitrary HTML attributes pass through
// ---------------------------------------------------------------------------
describe("props passthrough", () => {
  it("passes data-testid through to the DOM element", () => {
    render(<Badge data-testid="my-badge">test</Badge>);
    expect(screen.getByTestId("my-badge")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// AC-BADGE-16: className merging
// ---------------------------------------------------------------------------
describe("className merging", () => {
  it("merges custom className with base classes (both present)", () => {
    const el = renderBadge({ variant: "default", className: "opacity-60", children: "test" });
    expect(el.className).toContain("opacity-60");
    expect(el.className).toContain("inline-flex");
  });
});

// ---------------------------------------------------------------------------
// AC-BADGE-20: default variant when no variant prop supplied
// ---------------------------------------------------------------------------
describe("default variant", () => {
  it("uses default variant when no variant prop is supplied", () => {
    const el = renderBadge({ children: "test" });
    expect(el.className).toContain("bg-primary");
  });
});

// ---------------------------------------------------------------------------
// Standard variants (AC-BADGE-01 through AC-BADGE-04)
// ---------------------------------------------------------------------------
describe("standard variants", () => {
  it("AC-BADGE-01: default variant has bg-primary and text-primary-foreground", () => {
    const el = renderBadge({ variant: "default", children: "Default" });
    expect(el.className).toContain("bg-primary");
    expect(el.className).toContain("text-primary-foreground");
  });

  it("AC-BADGE-02: secondary variant has bg-secondary and text-secondary-foreground", () => {
    const el = renderBadge({ variant: "secondary", children: "Secondary" });
    expect(el.className).toContain("bg-secondary");
    expect(el.className).toContain("text-secondary-foreground");
  });

  it("AC-BADGE-03: outline variant has text-foreground class", () => {
    const el = renderBadge({ variant: "outline", children: "Outline" });
    expect(el.className).toContain("text-foreground");
  });

  it("AC-BADGE-04: destructive variant has bg-destructive and text-destructive-foreground", () => {
    const el = renderBadge({ variant: "destructive", children: "Destructive" });
    expect(el.className).toContain("bg-destructive");
    expect(el.className).toContain("text-destructive-foreground");
  });
});

// ---------------------------------------------------------------------------
// Semantic variants (AC-BADGE-05 through AC-BADGE-07)
// ---------------------------------------------------------------------------
describe("semantic variants", () => {
  it("AC-BADGE-05: success variant has success token classes", () => {
    const el = renderBadge({ variant: "success", children: "Success" });
    expect(el.className).toContain("bg-[var(--color-success-background)]");
    expect(el.className).toContain("text-[var(--color-success-foreground)]");
    expect(el.className).toContain("border-[var(--color-success-border)]");
  });

  it("AC-BADGE-06: warning variant has warning token classes", () => {
    const el = renderBadge({ variant: "warning", children: "Warning" });
    expect(el.className).toContain("bg-[var(--color-warning-background)]");
    expect(el.className).toContain("text-[var(--color-warning-foreground)]");
    expect(el.className).toContain("border-[var(--color-warning-border)]");
  });

  it("AC-BADGE-07: info variant has info token classes", () => {
    const el = renderBadge({ variant: "info", children: "Info" });
    expect(el.className).toContain("bg-[var(--color-info-background)]");
    expect(el.className).toContain("text-[var(--color-info-foreground)]");
    expect(el.className).toContain("border-[var(--color-info-border)]");
  });
});

// ---------------------------------------------------------------------------
// Certainty variants (AC-BADGE-08 through AC-BADGE-13)
// ---------------------------------------------------------------------------
describe("certainty variants", () => {
  it("AC-BADGE-08: certain variant has certainty-certain class", () => {
    const el = renderBadge({ variant: "certain", children: "Certain" });
    expect(el.className).toContain("certainty-certain");
  });

  it("AC-BADGE-09: probable variant has certainty-probable class", () => {
    const el = renderBadge({ variant: "probable", children: "Probable" });
    expect(el.className).toContain("certainty-probable");
  });

  it("AC-BADGE-10: possible variant has certainty-possible class", () => {
    const el = renderBadge({ variant: "possible", children: "Possible" });
    expect(el.className).toContain("certainty-possible");
  });

  it("AC-BADGE-11: unknown variant has certainty-unknown class", () => {
    const el = renderBadge({ variant: "unknown", children: "Unknown" });
    expect(el.className).toContain("certainty-unknown");
  });

  it("AC-BADGE-12: unevidenced variant has certainty-unevidenced class", () => {
    const el = renderBadge({ variant: "unevidenced", children: "Unevidenced" });
    expect(el.className).toContain("certainty-unevidenced");
  });

  it("AC-BADGE-13: unevidenced variant carries the certainty-unevidenced class (which sets border-style: dashed)", () => {
    const el = renderBadge({ variant: "unevidenced", children: "Unevidenced" });
    // The dashed border is enforced by the .certainty-unevidenced CSS utility class.
    // We verify the class is present; the CSS rule is defined in globals.css @layer components.
    expect(el.className).toContain("certainty-unevidenced");
  });

  it("certain variant does NOT contain certainty-probable or other levels", () => {
    const el = renderBadge({ variant: "certain", children: "Certain" });
    expect(el.className).not.toContain("certainty-probable");
    expect(el.className).not.toContain("certainty-possible");
    expect(el.className).not.toContain("certainty-unknown");
    expect(el.className).not.toContain("certainty-unevidenced");
  });

  it("each certainty variant contains exactly its own level class", () => {
    const levels = ["certain", "probable", "possible", "unknown", "unevidenced"] as const;
    for (const level of levels) {
      const el = renderBadge({ variant: level, children: level });
      expect(el.className).toContain(`certainty-${level}`);
    }
  });
});

// ---------------------------------------------------------------------------
// badgeVariants helper produces correct class strings
// ---------------------------------------------------------------------------
describe("badgeVariants helper", () => {
  it("returns a string for each certainty variant", () => {
    const levels = ["certain", "probable", "possible", "unknown", "unevidenced"] as const;
    for (const level of levels) {
      const cls = badgeVariants({ variant: level });
      expect(typeof cls).toBe("string");
      expect(cls).toContain(`certainty-${level}`);
    }
  });

  it("returns a string for semantic variants", () => {
    const semantics = ["success", "warning", "info"] as const;
    for (const s of semantics) {
      const cls = badgeVariants({ variant: s });
      expect(typeof cls).toBe("string");
      expect(cls).toContain(`--color-${s}-background`);
    }
  });
});
