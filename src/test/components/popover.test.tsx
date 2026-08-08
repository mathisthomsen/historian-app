import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Renders PopoverContent in the open state using `defaultOpen` on the root.
 *
 * Radix renders the content element into a Portal (document body). The styled
 * div that receives all PopoverContent classes is the direct child of the
 * Radix popper wrapper:
 *
 *   [data-radix-popper-content-wrapper] > div[data-side][data-state]
 */
function renderOpenPopover(props: React.ComponentProps<typeof PopoverContent> = {}) {
  render(
    <Popover defaultOpen>
      <PopoverTrigger asChild>
        <button>Open popover</button>
      </PopoverTrigger>
      <PopoverContent {...props}>
        <p>Popover content</p>
      </PopoverContent>
    </Popover>,
  );

  const el = document.querySelector(
    "[data-radix-popper-content-wrapper] > div",
  ) as HTMLElement | null;

  if (!el) throw new Error("PopoverContent div not found in DOM");
  return el;
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
describe("exports", () => {
  it("exports Popover", () => {
    expect(Popover).toBeDefined();
  });

  it("exports PopoverTrigger", () => {
    expect(PopoverTrigger).toBeDefined();
  });

  it("exports PopoverContent", () => {
    expect(PopoverContent).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// AC-PV-01 / AC-PV-02: surface tokens
// ---------------------------------------------------------------------------
describe("AC-PV-01/02: surface token classes", () => {
  it("AC-PV-01: has bg-popover class", () => {
    const el = renderOpenPopover();
    expect(el.className).toContain("bg-popover");
  });

  it("AC-PV-02: has text-popover-foreground class", () => {
    const el = renderOpenPopover();
    expect(el.className).toContain("text-popover-foreground");
  });
});

// ---------------------------------------------------------------------------
// AC-PV-03: border
// ---------------------------------------------------------------------------
describe("AC-PV-03: border classes", () => {
  it("has border class", () => {
    const el = renderOpenPopover();
    expect(el.className).toContain("border");
  });

  it("has border-border class", () => {
    const el = renderOpenPopover();
    expect(el.className).toContain("border-border");
  });
});

// ---------------------------------------------------------------------------
// AC-PV-04: shadow
// ---------------------------------------------------------------------------
describe("AC-PV-04: shadow", () => {
  it("has shadow-md class", () => {
    const el = renderOpenPopover();
    expect(el.className).toContain("shadow-md");
  });
});

// ---------------------------------------------------------------------------
// AC-PV-05: radius — must be rounded-lg, not merely rounded-md
// ---------------------------------------------------------------------------
describe("AC-PV-05: radius", () => {
  it("has rounded-lg class", () => {
    const el = renderOpenPopover();
    expect(el.className).toContain("rounded-lg");
  });

  it("does NOT have rounded-md as the radius class", () => {
    // rounded-lg supersedes rounded-md per spec; the class string should not
    // contain a bare rounded-md that would downgrade the radius.
    const el = renderOpenPopover();
    // Allow rounded-md only if rounded-lg is also present and comes after it,
    // but the canonical check is: rounded-md must not appear without rounded-lg.
    // Simpler: the implementation should not emit rounded-md at all.
    expect(el.className).not.toContain("rounded-md");
  });
});

// ---------------------------------------------------------------------------
// AC-PV-06: padding
// ---------------------------------------------------------------------------
describe("AC-PV-06: default padding", () => {
  it("has p-4 class", () => {
    const el = renderOpenPopover();
    expect(el.className).toContain("p-4");
  });
});

// ---------------------------------------------------------------------------
// AC-PV-07: default width
// ---------------------------------------------------------------------------
describe("AC-PV-07: default width", () => {
  it("has w-72 class", () => {
    const el = renderOpenPopover();
    expect(el.className).toContain("w-72");
  });
});

// ---------------------------------------------------------------------------
// AC-PV-08: z-index
// ---------------------------------------------------------------------------
describe("AC-PV-08: z-index", () => {
  it("has z-50 class", () => {
    const el = renderOpenPopover();
    expect(el.className).toContain("z-50");
  });
});

// ---------------------------------------------------------------------------
// AC-PV-09: outline-none
// ---------------------------------------------------------------------------
describe("AC-PV-09: outline-none", () => {
  it("has outline-none class", () => {
    const el = renderOpenPopover();
    expect(el.className).toContain("outline-none");
  });
});

// ---------------------------------------------------------------------------
// AC-PV-10/11/12: enter animation classes
// ---------------------------------------------------------------------------
describe("AC-PV-10/11/12: enter animation classes", () => {
  it("AC-PV-10: has data-[state=open]:animate-in class", () => {
    const el = renderOpenPopover();
    expect(el.className).toContain("data-[state=open]:animate-in");
  });

  it("AC-PV-11: has data-[state=open]:fade-in-0 class", () => {
    const el = renderOpenPopover();
    expect(el.className).toContain("data-[state=open]:fade-in-0");
  });

  it("AC-PV-12: has data-[state=open]:zoom-in-95 class", () => {
    const el = renderOpenPopover();
    expect(el.className).toContain("data-[state=open]:zoom-in-95");
  });
});

// ---------------------------------------------------------------------------
// AC-PV-13/14/15: exit animation classes
// ---------------------------------------------------------------------------
describe("AC-PV-13/14/15: exit animation classes", () => {
  it("AC-PV-13: has data-[state=closed]:animate-out class", () => {
    const el = renderOpenPopover();
    expect(el.className).toContain("data-[state=closed]:animate-out");
  });

  it("AC-PV-14: has data-[state=closed]:fade-out-0 class", () => {
    const el = renderOpenPopover();
    expect(el.className).toContain("data-[state=closed]:fade-out-0");
  });

  it("AC-PV-15: has data-[state=closed]:zoom-out-95 class", () => {
    const el = renderOpenPopover();
    expect(el.className).toContain("data-[state=closed]:zoom-out-95");
  });
});

// ---------------------------------------------------------------------------
// AC-PV-16/17/18/19: side-aware slide variants
// ---------------------------------------------------------------------------
describe("AC-PV-16-19: side-aware slide variants", () => {
  it("AC-PV-16: has data-[side=bottom]:slide-in-from-top-2 class", () => {
    const el = renderOpenPopover();
    expect(el.className).toContain("data-[side=bottom]:slide-in-from-top-2");
  });

  it("AC-PV-17: has data-[side=left]:slide-in-from-right-2 class", () => {
    const el = renderOpenPopover();
    expect(el.className).toContain("data-[side=left]:slide-in-from-right-2");
  });

  it("AC-PV-18: has data-[side=right]:slide-in-from-left-2 class", () => {
    const el = renderOpenPopover();
    expect(el.className).toContain("data-[side=right]:slide-in-from-left-2");
  });

  it("AC-PV-19: has data-[side=top]:slide-in-from-bottom-2 class", () => {
    const el = renderOpenPopover();
    expect(el.className).toContain("data-[side=top]:slide-in-from-bottom-2");
  });
});

// ---------------------------------------------------------------------------
// AC-PV-20: axe accessibility
// ---------------------------------------------------------------------------
describe("AC-PV-20: axe accessibility", () => {
  it("has no accessibility violations when open with aria-label", async () => {
    const { container } = render(
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <button>Show evidence</button>
        </PopoverTrigger>
        <PopoverContent aria-label="Evidence for birth year">
          <p>No citations yet.</p>
        </PopoverContent>
      </Popover>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ---------------------------------------------------------------------------
// AC-PV-21: closed state — content not in DOM
// ---------------------------------------------------------------------------
describe("AC-PV-21: closed state", () => {
  it("PopoverContent is not present in the DOM when popover is closed", () => {
    render(
      <Popover>
        <PopoverTrigger asChild>
          <button>Open popover</button>
        </PopoverTrigger>
        <PopoverContent>
          <p>Popover content</p>
        </PopoverContent>
      </Popover>,
    );

    const wrapper = document.querySelector("[data-radix-popper-content-wrapper]");
    expect(wrapper).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// AC-PV-22: open state — content is in DOM
// ---------------------------------------------------------------------------
describe("AC-PV-22: open state", () => {
  it("PopoverContent is present in the DOM when popover is open", () => {
    renderOpenPopover();
    expect(document.querySelector("[data-radix-popper-content-wrapper]")).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// AC-PV-23: trigger aria-controls
// ---------------------------------------------------------------------------
describe("AC-PV-23: trigger aria-controls", () => {
  it("trigger button has aria-controls pointing at the content element", () => {
    renderOpenPopover();
    const trigger = screen.getByRole("button", { name: "Open popover" });
    expect(trigger).toHaveAttribute("aria-controls");
    const contentId = trigger.getAttribute("aria-controls")!;
    const content = document.getElementById(contentId);
    expect(content).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// AC-PV-24: className merging
// ---------------------------------------------------------------------------
describe("AC-PV-24: className merging", () => {
  it("custom className is merged alongside base classes", () => {
    const el = renderOpenPopover({ className: "max-w-[360px]" });
    expect(el.className).toContain("max-w-[360px]");
    expect(el.className).toContain("bg-popover");
  });
});

// ---------------------------------------------------------------------------
// AC-PV-25: align default
// ---------------------------------------------------------------------------
describe("AC-PV-25: align default", () => {
  it("PopoverContent renders without error using default align=center", () => {
    // No explicit align prop — default should be "center".
    // The panel is still rendered (smoke test for default prop wiring).
    const el = renderOpenPopover();
    expect(el).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// AC-PV-26: sideOffset default
// ---------------------------------------------------------------------------
describe("AC-PV-26: sideOffset default", () => {
  it("PopoverContent renders without error using default sideOffset=4", () => {
    const el = renderOpenPopover();
    expect(el).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// AC-PV-27: no regression to rounded-md
// ---------------------------------------------------------------------------
describe("AC-PV-27: no rounded-md regression", () => {
  it("className does not contain rounded-md", () => {
    const el = renderOpenPopover();
    expect(el.className).not.toContain("rounded-md");
  });
});
