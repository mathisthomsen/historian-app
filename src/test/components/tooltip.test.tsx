import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Renders TooltipContent in the open state by using `defaultOpen` on the root.
 *
 * Radix renders the tooltip into the document body. The styled `<div>` that
 * receives all TooltipContent classes is wrapped in a popper container:
 *
 *   [data-radix-popper-content-wrapper] > div[data-side][data-state]
 *
 * Radix also renders a visually-hidden `<span role="tooltip">` INSIDE that
 * div for ARIA purposes. screen.getByRole("tooltip") finds that hidden span,
 * which has an empty className. We therefore query the styled div directly.
 */
function renderOpenTooltip(props: React.ComponentProps<typeof TooltipContent> = {}) {
  render(
    <TooltipProvider>
      <Tooltip defaultOpen>
        <TooltipTrigger asChild>
          <button>Trigger</button>
        </TooltipTrigger>
        <TooltipContent {...props}>
          <p>Tooltip text</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>,
  );

  // The styled TooltipContent div is the direct child of the popper wrapper.
  const el = document.querySelector(
    "[data-radix-popper-content-wrapper] > div",
  ) as HTMLElement | null;

  if (!el) throw new Error("TooltipContent div not found in DOM");
  return el;
}

// ---------------------------------------------------------------------------
// AC-TT-13: exports
// ---------------------------------------------------------------------------
describe("exports", () => {
  it("exports TooltipProvider", () => {
    expect(TooltipProvider).toBeDefined();
  });

  it("exports Tooltip", () => {
    expect(Tooltip).toBeDefined();
  });

  it("exports TooltipTrigger", () => {
    expect(TooltipTrigger).toBeDefined();
  });

  it("exports TooltipContent", () => {
    expect(TooltipContent).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// AC-TT-01 / AC-TT-02: surface tokens
// ---------------------------------------------------------------------------
describe("AC-TT-01/02: surface token classes", () => {
  it("AC-TT-01: TooltipContent has bg-popover class", () => {
    const el = renderOpenTooltip();
    expect(el.className).toContain("bg-popover");
  });

  it("AC-TT-02: TooltipContent has text-popover-foreground class", () => {
    const el = renderOpenTooltip();
    expect(el.className).toContain("text-popover-foreground");
  });
});

// ---------------------------------------------------------------------------
// AC-TT-03: border
// ---------------------------------------------------------------------------
describe("AC-TT-03: border classes", () => {
  it("has border class", () => {
    const el = renderOpenTooltip();
    expect(el.className).toContain("border");
  });

  it("has border-border class", () => {
    const el = renderOpenTooltip();
    expect(el.className).toContain("border-border");
  });
});

// ---------------------------------------------------------------------------
// AC-TT-04: shadow
// ---------------------------------------------------------------------------
describe("AC-TT-04: shadow", () => {
  it("has shadow-md class", () => {
    const el = renderOpenTooltip();
    expect(el.className).toContain("shadow-md");
  });
});

// ---------------------------------------------------------------------------
// AC-TT-05: radius
// ---------------------------------------------------------------------------
describe("AC-TT-05: radius", () => {
  it("has rounded-md class", () => {
    const el = renderOpenTooltip();
    expect(el.className).toContain("rounded-md");
  });
});

// ---------------------------------------------------------------------------
// AC-TT-06: typography
// ---------------------------------------------------------------------------
describe("AC-TT-06: typography", () => {
  it("has text-xs class", () => {
    const el = renderOpenTooltip();
    expect(el.className).toContain("text-xs");
  });
});

// ---------------------------------------------------------------------------
// AC-TT-07: enter animation classes
// ---------------------------------------------------------------------------
describe("AC-TT-07: enter animation classes", () => {
  it("has animate-in class", () => {
    const el = renderOpenTooltip();
    expect(el.className).toContain("animate-in");
  });

  it("has fade-in-0 class", () => {
    const el = renderOpenTooltip();
    expect(el.className).toContain("fade-in-0");
  });

  it("has zoom-in-95 class", () => {
    const el = renderOpenTooltip();
    expect(el.className).toContain("zoom-in-95");
  });
});

// ---------------------------------------------------------------------------
// AC-TT-08: exit animation classes
// ---------------------------------------------------------------------------
describe("AC-TT-08: exit animation classes", () => {
  it("has data-[state=closed]:animate-out class", () => {
    const el = renderOpenTooltip();
    expect(el.className).toContain("data-[state=closed]:animate-out");
  });

  it("has data-[state=closed]:fade-out-0 class", () => {
    const el = renderOpenTooltip();
    expect(el.className).toContain("data-[state=closed]:fade-out-0");
  });

  it("has data-[state=closed]:zoom-out-95 class", () => {
    const el = renderOpenTooltip();
    expect(el.className).toContain("data-[state=closed]:zoom-out-95");
  });
});

// ---------------------------------------------------------------------------
// AC-TT-09: side-aware slide variants
// ---------------------------------------------------------------------------
describe("AC-TT-09: side-aware slide variants", () => {
  it("has data-[side=top]:slide-in-from-bottom-2 class", () => {
    const el = renderOpenTooltip();
    expect(el.className).toContain("data-[side=top]:slide-in-from-bottom-2");
  });

  it("has data-[side=bottom]:slide-in-from-top-2 class", () => {
    const el = renderOpenTooltip();
    expect(el.className).toContain("data-[side=bottom]:slide-in-from-top-2");
  });

  it("has data-[side=left]:slide-in-from-right-2 class", () => {
    const el = renderOpenTooltip();
    expect(el.className).toContain("data-[side=left]:slide-in-from-right-2");
  });

  it("has data-[side=right]:slide-in-from-left-2 class", () => {
    const el = renderOpenTooltip();
    expect(el.className).toContain("data-[side=right]:slide-in-from-left-2");
  });
});

// ---------------------------------------------------------------------------
// AC-TT-10: ARIA role
// ---------------------------------------------------------------------------
describe("AC-TT-10: ARIA role", () => {
  it("role=tooltip element is present in DOM when tooltip is open", () => {
    // Radix renders a visually-hidden <span role="tooltip"> inside the content
    // div to supply the aria-describedby text. We verify it exists.
    render(
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger asChild>
            <button>Trigger</button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Tooltip text</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(screen.getByRole("tooltip")).toBeTruthy();
  });

  it("trigger has aria-describedby pointing at the tooltip span", () => {
    render(
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger asChild>
            <button>Trigger</button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Tooltip text</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    const trigger = screen.getByRole("button", { name: "Trigger" });
    expect(trigger).toHaveAttribute("aria-describedby");
    const describedById = trigger.getAttribute("aria-describedby")!;
    const tooltipSpan = document.getElementById(describedById);
    expect(tooltipSpan).not.toBeNull();
    expect(tooltipSpan?.getAttribute("role")).toBe("tooltip");
  });
});

// ---------------------------------------------------------------------------
// AC-TT-11: className merging
// ---------------------------------------------------------------------------
describe("AC-TT-11: className merging", () => {
  it("custom className is present alongside base classes", () => {
    const el = renderOpenTooltip({ className: "opacity-80" });
    expect(el.className).toContain("opacity-80");
    expect(el.className).toContain("bg-popover");
  });
});

// ---------------------------------------------------------------------------
// AC-TT-12: inverted scheme NOT present
// ---------------------------------------------------------------------------
describe("AC-TT-12: inverted scheme removed", () => {
  it("does not contain bg-foreground", () => {
    const el = renderOpenTooltip();
    expect(el.className).not.toContain("bg-foreground");
  });

  it("does not contain text-background", () => {
    const el = renderOpenTooltip();
    expect(el.className).not.toContain("text-background");
  });
});

// ---------------------------------------------------------------------------
// AC-TT-14: overflow-hidden
// ---------------------------------------------------------------------------
describe("AC-TT-14: overflow-hidden", () => {
  it("has overflow-hidden class", () => {
    const el = renderOpenTooltip();
    expect(el.className).toContain("overflow-hidden");
  });
});

// ---------------------------------------------------------------------------
// AC-TT-15: axe accessibility
// ---------------------------------------------------------------------------
describe("AC-TT-15: axe accessibility", () => {
  it("has no accessibility violations when open", async () => {
    const { container } = render(
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger asChild>
            <button aria-label="Delete record">Delete</button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete this record permanently</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
