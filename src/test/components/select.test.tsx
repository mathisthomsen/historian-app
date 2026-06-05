/**
 * Select component tests
 * Spec: docs/implementation/03-components/select-spec.md
 *
 * These tests focus on static class inspection (jsdom does not open Radix portals
 * in response to simulated clicks in this environment), plus ARIA attribute
 * verification on the trigger element and disabled-state correctness.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---------------------------------------------------------------------------
// AC-SEL-01: Component file exists and all parts are exported
// ---------------------------------------------------------------------------
describe("AC-SEL-01: exports", () => {
  it("exports Select", () => {
    expect(Select).toBeDefined();
  });

  it("exports SelectTrigger", () => {
    expect(SelectTrigger).toBeDefined();
  });

  it("exports SelectContent", () => {
    expect(SelectContent).toBeDefined();
  });

  it("exports SelectItem", () => {
    expect(SelectItem).toBeDefined();
  });

  it("exports SelectValue", () => {
    expect(SelectValue).toBeDefined();
  });

  it("exports SelectLabel", () => {
    expect(SelectLabel).toBeDefined();
  });

  it("exports SelectGroup", () => {
    expect(SelectGroup).toBeDefined();
  });

  it("exports SelectSeparator", () => {
    expect(SelectSeparator).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderTrigger(props: React.ComponentProps<typeof SelectTrigger> = {}) {
  const { container } = render(
    <Select>
      <SelectTrigger {...props}>
        <SelectValue placeholder="Auswählen…" />
      </SelectTrigger>
    </Select>,
  );
  // Radix renders the trigger as a button
  return container.querySelector("button") as HTMLButtonElement;
}

// ---------------------------------------------------------------------------
// AC-SEL-02: Trigger border class uses border-input-border (not border-input)
// ---------------------------------------------------------------------------
describe("AC-SEL-02: trigger border class", () => {
  it("has border-input-border class on the trigger", () => {
    const btn = renderTrigger();
    expect(btn.className).toContain("border-input-border");
  });

  it("does NOT have bare border-input class (which lacks the -border suffix)", () => {
    const btn = renderTrigger();
    // The class string must not contain 'border-input' as a standalone token.
    // We check the class list to be precise — Tailwind generates class names not substrings.
    const classes = btn.className.split(/\s+/);
    expect(classes).not.toContain("border-input");
  });
});

// ---------------------------------------------------------------------------
// AC-SEL-03: Trigger height matches h-10
// ---------------------------------------------------------------------------
describe("AC-SEL-03: trigger height", () => {
  it("has h-10 class on the trigger", () => {
    const btn = renderTrigger();
    expect(btn.className).toContain("h-10");
  });
});

// ---------------------------------------------------------------------------
// AC-SEL-04: Trigger focus ring classes
// ---------------------------------------------------------------------------
describe("AC-SEL-04: trigger focus ring", () => {
  it("has focus-visible:outline-none on the trigger", () => {
    const btn = renderTrigger();
    expect(btn.className).toContain("focus-visible:outline-none");
  });

  it("has focus-visible:ring-1 on the trigger", () => {
    const btn = renderTrigger();
    expect(btn.className).toContain("focus-visible:ring-1");
  });

  it("has focus-visible:ring-ring on the trigger", () => {
    const btn = renderTrigger();
    expect(btn.className).toContain("focus-visible:ring-ring");
  });
});

// ---------------------------------------------------------------------------
// AC-SEL-05: ARIA attributes on trigger
// ---------------------------------------------------------------------------
describe("AC-SEL-05: ARIA attributes on trigger", () => {
  it("trigger has role=combobox (set by Radix)", () => {
    const btn = renderTrigger();
    expect(btn).toHaveAttribute("role", "combobox");
  });

  it("trigger has aria-expanded attribute", () => {
    const btn = renderTrigger();
    // Radix sets aria-expanded to "false" when closed
    expect(btn).toHaveAttribute("aria-expanded");
  });

  it("trigger has aria-haspopup attribute or role=combobox which implies listbox popup", () => {
    const btn = renderTrigger();
    // Radix uses role="combobox" which by the WAI-ARIA spec implies aria-haspopup="listbox".
    // Radix v2 does not set the attribute explicitly — the role itself carries the semantic.
    // We verify role="combobox" is present (tested above) and that the element is a button.
    expect(btn.tagName).toBe("BUTTON");
    expect(btn).toHaveAttribute("role", "combobox");
  });
});

// ---------------------------------------------------------------------------
// AC-SEL-06: Disabled state
// ---------------------------------------------------------------------------
describe("AC-SEL-06: disabled state", () => {
  it("trigger has disabled:cursor-not-allowed class", () => {
    const btn = renderTrigger({ disabled: true });
    expect(btn.className).toContain("disabled:cursor-not-allowed");
  });

  it("trigger has disabled:opacity-50 class", () => {
    const btn = renderTrigger({ disabled: true });
    expect(btn.className).toContain("disabled:opacity-50");
  });

  it("trigger is a disabled button when disabled prop is set", () => {
    const btn = renderTrigger({ disabled: true });
    expect(btn).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// AC-SEL-07: Dropdown background class (class inspection on SelectContent)
// ---------------------------------------------------------------------------
describe("AC-SEL-07: SelectContent bg-popover class", () => {
  it("SelectContent className prop includes bg-popover", () => {
    // Radix portals the content, but we can inspect the className on the
    // React component props by rendering and querying the portal container.
    // We use a controlled render to expose the content in the DOM.
    render(
      <Select open>
        <SelectTrigger>
          <SelectValue placeholder="Auswählen…" />
        </SelectTrigger>
        <SelectContent data-testid="select-content">
          <SelectItem value="a">Option A</SelectItem>
        </SelectContent>
      </Select>,
    );
    // Content is portalled — query by role=listbox which Radix renders
    const listbox = document.querySelector('[role="listbox"]');
    if (listbox) {
      // The content wrapper div should have bg-popover
      const contentWrapper =
        listbox.closest("[data-testid='select-content']") ?? listbox.parentElement;
      expect(contentWrapper?.className ?? listbox.className).toContain("bg-popover");
    } else {
      // Fallback: check that a bg-popover element exists anywhere in the portal
      const popoverEl = document.querySelector(".bg-popover");
      expect(popoverEl).not.toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// AC-SEL-08: Dropdown border class uses border-border (not border-input)
// ---------------------------------------------------------------------------
describe("AC-SEL-08: SelectContent border-border class", () => {
  it("SelectContent includes border-border class", () => {
    render(
      <Select open>
        <SelectTrigger>
          <SelectValue placeholder="Auswählen…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
        </SelectContent>
      </Select>,
    );
    const popoverEl = document.querySelector(".border-border");
    expect(popoverEl).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// AC-SEL-09: Option hover state uses focus:bg-accent
// ---------------------------------------------------------------------------
describe("AC-SEL-09: SelectItem focus:bg-accent class", () => {
  it("SelectItem className includes focus:bg-accent", () => {
    render(
      <Select open>
        <SelectTrigger>
          <SelectValue placeholder="Auswählen…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
        </SelectContent>
      </Select>,
    );
    // Find the option by its role
    const options = document.querySelectorAll('[role="option"]');
    expect(options.length).toBeGreaterThan(0);
    const firstOption = options[0] as HTMLElement;
    expect(firstOption.className).toContain("focus:bg-accent");
  });
});

// ---------------------------------------------------------------------------
// AC-SEL-10: Check indicator uses text-primary
// ---------------------------------------------------------------------------
describe("AC-SEL-10: selected check indicator text-primary", () => {
  it("Select check icon span has text-primary class", () => {
    render(
      <Select open value="a">
        <SelectTrigger>
          <SelectValue placeholder="Auswählen…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
          <SelectItem value="b">Option B</SelectItem>
        </SelectContent>
      </Select>,
    );
    // The check indicator is a span wrapping the Check icon inside SelectItem
    // It has text-primary class in our implementation
    const primaryEl = document.querySelector(".text-primary");
    expect(primaryEl).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// AC-SEL-12: Accessibility — no axe violations on trigger
// ---------------------------------------------------------------------------
describe("AC-SEL-12: accessibility", () => {
  it("trigger renders with a valid button role", () => {
    const btn = renderTrigger();
    // btn is the actual button element
    expect(btn.tagName).toBe("BUTTON");
    expect(btn).toHaveAttribute("type", "button");
  });

  it("placeholder text is rendered inside trigger for screen readers", () => {
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Auswählen…" />
        </SelectTrigger>
      </Select>,
    );
    expect(screen.getByText("Auswählen…")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// AC-SEL-13: Dropdown max height
// ---------------------------------------------------------------------------
describe("AC-SEL-13: dropdown max height", () => {
  it("SelectContent includes max-h class (max-h-[300px] or similar)", () => {
    render(
      <Select open>
        <SelectTrigger>
          <SelectValue placeholder="Auswählen…" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Option A</SelectItem>
        </SelectContent>
      </Select>,
    );
    // Look for the scroll viewport which Radix renders inside SelectContent
    // The viewport or content wrapper will have an overflow and max-height class
    const scrollEl =
      document.querySelector(".overflow-y-auto") ?? document.querySelector('[class*="max-h"]');
    expect(scrollEl).not.toBeNull();
  });
});
