/**
 * Dialog / Modal component tests
 * Spec: docs/implementation/03-components/dialog-spec.md
 *
 * Tests cover:
 * - Visual/token: overlay bg-background/80 (not bg-black), backdrop-blur-sm
 * - Content: bg-card, border-border, shadow-lg, rounded-lg
 * - Animation classes on content
 * - Typography: DialogTitle (text-lg font-semibold), DialogDescription (text-muted-foreground)
 * - Close button styling
 * - ARIA: role="dialog", aria-modal="true"
 * - axe-core accessibility audit
 */

import * as React from "react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
} from "@/components/ui/dialog";

import { render, screen } from "../render";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getClasses(element: HTMLElement): string[] {
  return element.className.split(/\s+/).filter(Boolean);
}

/**
 * Renders DialogOverlay inside a Dialog root so the Radix context is satisfied.
 * The overlay is rendered outside a Portal here so it appears in container.
 */
function renderOverlay(props: React.ComponentPropsWithoutRef<typeof DialogOverlay> = {}) {
  const { container } = render(
    <Dialog open>
      <DialogOverlay {...props} />
    </Dialog>,
  );
  // The overlay is the div rendered directly as child of the container div
  return container.querySelector(".fixed.inset-0") as HTMLElement;
}

/**
 * Renders a full open Dialog so DialogContent is in the DOM.
 * DialogContent renders via a Portal so we must query from document.body.
 */
function renderOpenDialog(props: { contentClassName?: string } = {}) {
  render(
    <Dialog open>
      <DialogContent className={props.contentClassName}>
        <DialogHeader>
          <DialogTitle>Test Dialog</DialogTitle>
          <DialogDescription>Test description.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>,
  );
}

// ---------------------------------------------------------------------------
// AC-DLG-01 / AC-DLG-20: Overlay uses warm bg-background/80, not black
// ---------------------------------------------------------------------------

describe("DialogOverlay — warm scrim token", () => {
  it("AC-DLG-01: has bg-background/80 class", () => {
    const el = renderOverlay();
    expect(getClasses(el)).toContain("bg-background/80");
  });

  it("AC-DLG-20: does NOT have bg-black/80 class", () => {
    const el = renderOverlay();
    expect(getClasses(el)).not.toContain("bg-black/80");
  });
});

// ---------------------------------------------------------------------------
// AC-DLG-02: Overlay backdrop blur
// ---------------------------------------------------------------------------

describe("DialogOverlay — backdrop-blur-sm", () => {
  it("AC-DLG-02: has backdrop-blur-sm class", () => {
    const el = renderOverlay();
    expect(getClasses(el)).toContain("backdrop-blur-sm");
  });
});

// ---------------------------------------------------------------------------
// AC-DLG-03 / AC-DLG-19: Content surface token
// ---------------------------------------------------------------------------

describe("DialogContent — surface token", () => {
  it("AC-DLG-03: has bg-card class", () => {
    renderOpenDialog();
    // DialogContent renders via Portal into document.body
    const content = document.querySelector("[role='dialog']") as HTMLElement;
    expect(content).not.toBeNull();
    expect(getClasses(content)).toContain("bg-card");
  });

  it("AC-DLG-19: does NOT have bg-background class (old default)", () => {
    renderOpenDialog();
    const content = document.querySelector("[role='dialog']") as HTMLElement;
    expect(content).not.toBeNull();
    // Must not contain standalone "bg-background" (would be the old shadcn default)
    expect(getClasses(content)).not.toContain("bg-background");
  });
});

// ---------------------------------------------------------------------------
// AC-DLG-04: Content border
// ---------------------------------------------------------------------------

describe("DialogContent — border", () => {
  it("AC-DLG-04: has border-border class", () => {
    renderOpenDialog();
    const content = document.querySelector("[role='dialog']") as HTMLElement;
    expect(getClasses(content)).toContain("border-border");
  });
});

// ---------------------------------------------------------------------------
// AC-DLG-05: Content shadow
// ---------------------------------------------------------------------------

describe("DialogContent — shadow", () => {
  it("AC-DLG-05: has shadow-lg class", () => {
    renderOpenDialog();
    const content = document.querySelector("[role='dialog']") as HTMLElement;
    expect(getClasses(content)).toContain("shadow-lg");
  });
});

// ---------------------------------------------------------------------------
// AC-DLG-06: Content radius
// ---------------------------------------------------------------------------

describe("DialogContent — radius", () => {
  it("AC-DLG-06: has rounded-lg class", () => {
    renderOpenDialog();
    const content = document.querySelector("[role='dialog']") as HTMLElement;
    expect(getClasses(content)).toContain("rounded-lg");
  });
});

// ---------------------------------------------------------------------------
// AC-DLG-07 / AC-DLG-08 / AC-DLG-09: Animation classes
// ---------------------------------------------------------------------------

describe("DialogContent — animation classes", () => {
  it("AC-DLG-07: has data-[state=open]:animate-in class", () => {
    renderOpenDialog();
    const content = document.querySelector("[role='dialog']") as HTMLElement;
    expect(content.className).toContain("data-[state=open]:animate-in");
  });

  it("AC-DLG-08: has zoom-in-95 class", () => {
    renderOpenDialog();
    const content = document.querySelector("[role='dialog']") as HTMLElement;
    expect(content.className).toContain("zoom-in-95");
  });

  it("AC-DLG-08: has slide-in-from-bottom-2 class", () => {
    renderOpenDialog();
    const content = document.querySelector("[role='dialog']") as HTMLElement;
    expect(content.className).toContain("slide-in-from-bottom-2");
  });

  it("AC-DLG-09: has duration-[var(--duration-normal)] class", () => {
    renderOpenDialog();
    const content = document.querySelector("[role='dialog']") as HTMLElement;
    expect(content.className).toContain("duration-[var(--duration-normal)]");
  });
});

// ---------------------------------------------------------------------------
// AC-DLG-10 / AC-DLG-11: DialogTitle typography
// ---------------------------------------------------------------------------

describe("DialogTitle", () => {
  it("AC-DLG-10: has text-lg class", () => {
    renderOpenDialog();
    const title = screen.getByText("Test Dialog");
    expect(getClasses(title)).toContain("text-lg");
  });

  it("AC-DLG-11: has font-semibold class", () => {
    renderOpenDialog();
    const title = screen.getByText("Test Dialog");
    expect(getClasses(title)).toContain("font-semibold");
  });
});

// ---------------------------------------------------------------------------
// AC-DLG-12 / AC-DLG-13: DialogDescription
// ---------------------------------------------------------------------------

describe("DialogDescription", () => {
  it("AC-DLG-12: has text-muted-foreground class", () => {
    renderOpenDialog();
    const desc = screen.getByText("Test description.");
    expect(getClasses(desc)).toContain("text-muted-foreground");
  });

  it("AC-DLG-13: has text-sm class", () => {
    renderOpenDialog();
    const desc = screen.getByText("Test description.");
    expect(getClasses(desc)).toContain("text-sm");
  });
});

// ---------------------------------------------------------------------------
// AC-DLG-14 / AC-DLG-15: ARIA attributes
// ---------------------------------------------------------------------------

describe("Dialog — ARIA", () => {
  it("AC-DLG-14: dialog element has role='dialog'", () => {
    renderOpenDialog();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("AC-DLG-15: dialog element has aria-modal='true'", () => {
    renderOpenDialog();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });
});

// ---------------------------------------------------------------------------
// AC-DLG-16 / AC-DLG-17 / AC-DLG-18: Close button styling
// ---------------------------------------------------------------------------

describe("Dialog close button", () => {
  /**
   * The X-icon close button is the DialogPrimitive.Close rendered inside
   * DialogContent. It has a sr-only span with text "Close" and an SVG icon.
   * We locate it by finding the button that contains the sr-only span,
   * distinguishing it from any consumer-supplied Close button in the footer.
   */
  function getXCloseButton(): HTMLElement {
    // The X button is the one with absolute positioning (absolute right-4 top-4)
    const dialog = document.querySelector("[role='dialog']") as HTMLElement;
    const buttons = dialog.querySelectorAll("button");
    // The icon close button has the sr-only span with "Close" text AND an SVG sibling
    for (const btn of buttons) {
      const srSpan = btn.querySelector(".sr-only");
      const hasSvg = btn.querySelector("svg") !== null;
      if (srSpan && hasSvg) return btn as HTMLElement;
    }
    throw new Error("X close button not found");
  }

  it("AC-DLG-16: close button has text-muted-foreground class", () => {
    renderOpenDialog();
    const closeBtn = getXCloseButton();
    expect(getClasses(closeBtn)).toContain("text-muted-foreground");
  });

  it("AC-DLG-17: close button has hover:text-foreground class", () => {
    renderOpenDialog();
    const closeBtn = getXCloseButton();
    expect(closeBtn.className).toContain("hover:text-foreground");
  });

  it("AC-DLG-18: close button has focus:ring-2 and focus:ring-ring classes", () => {
    renderOpenDialog();
    const closeBtn = getXCloseButton();
    expect(closeBtn.className).toContain("focus:ring-2");
    expect(closeBtn.className).toContain("focus:ring-ring");
  });
});

// ---------------------------------------------------------------------------
// AC-DLG-21: Full composition renders all content
// ---------------------------------------------------------------------------

describe("Dialog — full composition", () => {
  it("AC-DLG-21: renders title, description and footer content", () => {
    renderOpenDialog();
    expect(screen.getByText("Test Dialog")).toBeInTheDocument();
    expect(screen.getByText("Test description.")).toBeInTheDocument();
    // Footer Close button text (from DialogClose in the renderOpenDialog footer)
    expect(screen.getAllByText("Close").length).toBeGreaterThan(0);
  });

  it("AC-DLG-21: DialogHeader renders both title and description children", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Relation erstellen</DialogTitle>
            <DialogDescription>Beziehung zwischen zwei Entitäten.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>Abbrechen</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText("Relation erstellen")).toBeInTheDocument();
    expect(screen.getByText("Beziehung zwischen zwei Entitäten.")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// AC-DLG-22: axe-core accessibility audit
// ---------------------------------------------------------------------------

describe("Dialog — accessibility audit", () => {
  it("AC-DLG-22: passes axe-core with no violations", async () => {
    const { baseElement } = render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accessible Dialog</DialogTitle>
            <DialogDescription>This dialog is accessible.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose>Cancel</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    // axe must scan document.body (which includes the portal-rendered dialog)
    const results = await axe(baseElement);
    expect(results).toHaveNoViolations();
  });
});
