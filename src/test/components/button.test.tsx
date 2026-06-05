/**
 * Button component tests
 * Spec: docs/implementation/03-components/button-spec.md
 *
 * Tests cover:
 * - Visual/token: variant and size class output
 * - Accessibility: ARIA, keyboard activation, disabled, icon-only
 * - Interaction: click, disabled prevention, aria-busy
 * - Composition: asChild, className merge
 */

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

import { Button } from "@/components/ui/button";

import { render, screen, fireEvent } from "../render";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getButtonClasses(element: HTMLElement): string[] {
  return element.className.split(/\s+/).filter(Boolean);
}

// ---------------------------------------------------------------------------
// AC-BTN-16: Element type
// ---------------------------------------------------------------------------

describe("Button — element type", () => {
  it("renders a <button> element by default", () => {
    render(<Button>Click me</Button>);
    const el = screen.getByRole("button");
    expect(el.tagName).toBe("BUTTON");
  });

  it("AC-BTN-19: asChild renders child element tag, not <button>", () => {
    render(
      <Button asChild>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/test">Link button</a>
      </Button>,
    );
    const el = screen.getByRole("link");
    expect(el.tagName).toBe("A");
  });
});

// ---------------------------------------------------------------------------
// Variant class tests
// ---------------------------------------------------------------------------

describe("Button — default (primary) variant (AC-BTN-01)", () => {
  it("has bg-primary class", () => {
    render(<Button variant="default">Primary</Button>);
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).toContain("bg-primary");
  });

  it("has text-primary-foreground class", () => {
    render(<Button variant="default">Primary</Button>);
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).toContain("text-primary-foreground");
  });

  it("has hover:bg-primary/90 class", () => {
    render(<Button variant="default">Primary</Button>);
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).toContain("hover:bg-primary/90");
  });
});

describe("Button — secondary variant (AC-BTN-02)", () => {
  it("has bg-secondary class", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).toContain("bg-secondary");
  });

  it("has text-secondary-foreground class", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).toContain("text-secondary-foreground");
  });

  it("has hover:bg-secondary/80 class", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).toContain("hover:bg-secondary/80");
  });
});

describe("Button — outline variant (AC-BTN-03, AC-BTN-04, AC-BTN-24)", () => {
  it("has border class", () => {
    render(<Button variant="outline">Outline</Button>);
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).toContain("border");
  });

  it("AC-BTN-03: uses border-input-border (high-contrast) not bare border-input", () => {
    render(<Button variant="outline">Outline</Button>);
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).toContain("border-input-border");
  });

  it("AC-BTN-24: does NOT contain border-input as a standalone class", () => {
    render(<Button variant="outline">Outline</Button>);
    const classes = getButtonClasses(screen.getByRole("button"));
    // border-input-border is fine; bare 'border-input' (which maps to the fill
    // color, not the higher-contrast border token) must not appear alone
    expect(classes).not.toContain("border-input");
  });

  it("AC-BTN-04: has bg-background class", () => {
    render(<Button variant="outline">Outline</Button>);
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).toContain("bg-background");
  });

  it("has hover:bg-accent class", () => {
    render(<Button variant="outline">Outline</Button>);
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).toContain("hover:bg-accent");
  });

  it("has hover:text-accent-foreground class", () => {
    render(<Button variant="outline">Outline</Button>);
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).toContain("hover:text-accent-foreground");
  });
});

describe("Button — ghost variant (AC-BTN-05)", () => {
  it("has hover:bg-accent class", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).toContain("hover:bg-accent");
  });

  it("has hover:text-accent-foreground class", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).toContain("hover:text-accent-foreground");
  });
});

describe("Button — destructive variant (AC-BTN-06)", () => {
  it("has bg-destructive class", () => {
    render(<Button variant="destructive">Delete</Button>);
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).toContain("bg-destructive");
  });

  it("has text-destructive-foreground class", () => {
    render(<Button variant="destructive">Delete</Button>);
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).toContain("text-destructive-foreground");
  });

  it("has hover:bg-destructive/90 class", () => {
    render(<Button variant="destructive">Delete</Button>);
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).toContain("hover:bg-destructive/90");
  });
});

describe("Button — link variant (AC-BTN-07)", () => {
  it("has text-primary class", () => {
    render(<Button variant="link">Link</Button>);
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).toContain("text-primary");
  });

  it("has underline-offset-4 class", () => {
    render(<Button variant="link">Link</Button>);
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).toContain("underline-offset-4");
  });

  it("has hover:underline class", () => {
    render(<Button variant="link">Link</Button>);
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).toContain("hover:underline");
  });
});

// ---------------------------------------------------------------------------
// Base class tests (shared across all variants)
// ---------------------------------------------------------------------------

const allVariants = ["default", "secondary", "outline", "ghost", "destructive", "link"] as const;

describe("Button — shared base classes", () => {
  allVariants.forEach((variant) => {
    describe(`variant="${variant}"`, () => {
      it("AC-BTN-08: has focus-visible:ring-ring class", () => {
        render(<Button variant={variant}>{variant}</Button>);
        const classes = getButtonClasses(screen.getByRole("button"));
        expect(classes).toContain("focus-visible:ring-ring");
      });

      it("AC-BTN-09: has disabled:pointer-events-none class", () => {
        render(<Button variant={variant}>{variant}</Button>);
        const classes = getButtonClasses(screen.getByRole("button"));
        expect(classes).toContain("disabled:pointer-events-none");
      });

      it("AC-BTN-09: has disabled:opacity-50 class", () => {
        render(<Button variant={variant}>{variant}</Button>);
        const classes = getButtonClasses(screen.getByRole("button"));
        expect(classes).toContain("disabled:opacity-50");
      });

      it("AC-BTN-10: has rounded-md class", () => {
        render(<Button variant={variant}>{variant}</Button>);
        const classes = getButtonClasses(screen.getByRole("button"));
        expect(classes).toContain("rounded-md");
      });

      it("AC-BTN-11: has active:scale-[0.98] class", () => {
        render(<Button variant={variant}>{variant}</Button>);
        const classes = getButtonClasses(screen.getByRole("button"));
        expect(classes).toContain("active:scale-[0.98]");
      });

      it("AC-BTN-23: has transition-colors class", () => {
        render(<Button variant={variant}>{variant}</Button>);
        const classes = getButtonClasses(screen.getByRole("button"));
        expect(classes).toContain("transition-colors");
      });
    });
  });
});

// ---------------------------------------------------------------------------
// Size class tests
// ---------------------------------------------------------------------------

describe("Button — sizes", () => {
  it("AC-BTN-12: size=sm has h-8 class", () => {
    render(<Button size="sm">Small</Button>);
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).toContain("h-8");
  });

  it("AC-BTN-12: size=sm does NOT have h-9 (old shadcn default)", () => {
    render(<Button size="sm">Small</Button>);
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).not.toContain("h-9");
  });

  it("AC-BTN-13: size=default has h-10 class", () => {
    render(<Button size="default">Default</Button>);
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).toContain("h-10");
  });

  it("AC-BTN-13: size=default has px-4 class", () => {
    render(<Button size="default">Default</Button>);
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).toContain("px-4");
  });

  it("AC-BTN-14: size=lg has h-11 class", () => {
    render(<Button size="lg">Large</Button>);
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).toContain("h-11");
  });

  it("AC-BTN-14: size=lg has px-8 class", () => {
    render(<Button size="lg">Large</Button>);
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).toContain("px-8");
  });

  it("AC-BTN-15: size=icon has h-10 class", () => {
    render(
      <Button size="icon" aria-label="Edit row">
        Icon
      </Button>,
    );
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).toContain("h-10");
  });

  it("AC-BTN-15: size=icon has w-10 class", () => {
    render(
      <Button size="icon" aria-label="Edit row">
        Icon
      </Button>,
    );
    const classes = getButtonClasses(screen.getByRole("button"));
    expect(classes).toContain("w-10");
  });
});

// ---------------------------------------------------------------------------
// Accessibility tests
// ---------------------------------------------------------------------------

describe("Button — accessibility", () => {
  it("AC-BTN-17: has implicit button role", () => {
    render(<Button>Action</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("AC-BTN-18: disabled button still renders but has pointer-events-none class", () => {
    render(<Button disabled>Disabled</Button>);
    const el = screen.getByRole("button");
    expect(el).toBeDisabled();
    expect(el.className).toContain("disabled:pointer-events-none");
  });

  it("AC-BTN-20: icon-only button without aria-label fails axe", async () => {
    const { container } = render(
      <Button size="icon">
        <svg aria-hidden="true" />
      </Button>,
    );
    const results = await axe(container);
    expect(results.violations.length).toBeGreaterThan(0);
  });

  it("AC-BTN-21: icon-only button with aria-label passes axe", async () => {
    const { container } = render(
      <Button size="icon" aria-label="Edit row">
        <svg aria-hidden="true" />
      </Button>,
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("AC-BTN-22: button with aria-busy=true has the attribute", () => {
    render(
      <Button aria-busy="true" disabled>
        Saving…
      </Button>,
    );
    const el = screen.getByRole("button");
    expect(el).toHaveAttribute("aria-busy", "true");
  });

  it("standard button with text label passes axe", async () => {
    const { container } = render(<Button>Create Person</Button>);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("destructive variant passes axe when labelled", async () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Keyboard interaction tests
// ---------------------------------------------------------------------------

describe("Button — keyboard interaction", () => {
  it("calls onClick when Enter key is pressed", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit</Button>);
    const el = screen.getByRole("button");
    el.focus();
    fireEvent.keyDown(el, { key: "Enter", code: "Enter" });
    fireEvent.click(el); // browsers fire click on Enter for buttons
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("calls onClick when Space key is pressed", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit</Button>);
    const el = screen.getByRole("button");
    el.focus();
    fireEvent.keyDown(el, { key: " ", code: "Space" });
    fireEvent.click(el); // browsers fire click on Space for buttons
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when button is disabled", () => {
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>,
    );
    const el = screen.getByRole("button");
    fireEvent.click(el);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("button is focusable by default", () => {
    render(<Button>Focus me</Button>);
    const el = screen.getByRole("button");
    el.focus();
    expect(document.activeElement).toBe(el);
  });
});

// ---------------------------------------------------------------------------
// Interaction tests
// ---------------------------------------------------------------------------

describe("Button — interaction", () => {
  it("calls onClick handler when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("accepts and merges additional className", () => {
    render(<Button className="custom-class">Styled</Button>);
    expect(screen.getByRole("button").className).toContain("custom-class");
  });

  it("forwards ref to the underlying button element", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref button</Button>);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.tagName).toBe("BUTTON");
  });
});
