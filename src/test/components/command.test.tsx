/**
 * Command Palette component tests
 * Spec: docs/implementation/03-components/command-spec.md
 *
 * Tests cover:
 * - Visual/token: class output for all sub-components
 * - ARIA attributes provided by cmdk
 * - axe-core accessibility audit
 */

import * as React from "react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

import { render, screen } from "../render";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getClasses(element: HTMLElement): string[] {
  return element.className.split(/\s+/).filter(Boolean);
}

// ---------------------------------------------------------------------------
// AC-CMD-09: Command root background
// ---------------------------------------------------------------------------

describe("Command — root", () => {
  it("AC-CMD-09: has bg-popover class", () => {
    render(
      <Command>
        <CommandList aria-label="results">
          <CommandEmpty>No results</CommandEmpty>
        </CommandList>
      </Command>,
    );
    // The Command primitive renders as [cmdk-root] — find by its wrapper div
    const root = document.querySelector("[cmdk-root]") as HTMLElement;
    expect(root).toBeTruthy();
    expect(getClasses(root)).toContain("bg-popover");
  });

  it("AC-CMD-09: has text-popover-foreground class", () => {
    render(
      <Command>
        <CommandList aria-label="results">
          <CommandEmpty>No results</CommandEmpty>
        </CommandList>
      </Command>,
    );
    const root = document.querySelector("[cmdk-root]") as HTMLElement;
    expect(getClasses(root)).toContain("text-popover-foreground");
  });
});

// ---------------------------------------------------------------------------
// AC-CMD-01–02: CommandInput
// ---------------------------------------------------------------------------

describe("CommandInput — wrapper border", () => {
  it("AC-CMD-01: wrapper div has border-b class", () => {
    render(
      <Command>
        <CommandInput placeholder="Search…" />
        <CommandList aria-label="results">
          <CommandEmpty>No results</CommandEmpty>
        </CommandList>
      </Command>,
    );
    // The wrapper div carries cmdk-input-wrapper
    const wrapper = document.querySelector("[cmdk-input-wrapper]") as HTMLElement;
    expect(wrapper).toBeTruthy();
    expect(getClasses(wrapper)).toContain("border-b");
  });

  it("AC-CMD-01: wrapper div has border-border class", () => {
    render(
      <Command>
        <CommandInput placeholder="Search…" />
        <CommandList aria-label="results">
          <CommandEmpty>No results</CommandEmpty>
        </CommandList>
      </Command>,
    );
    const wrapper = document.querySelector("[cmdk-input-wrapper]") as HTMLElement;
    expect(getClasses(wrapper)).toContain("border-border");
  });
});

describe("CommandInput — inner input", () => {
  it("AC-CMD-02: has placeholder:text-muted-foreground class", () => {
    render(
      <Command>
        <CommandInput placeholder="Search…" />
        <CommandList aria-label="results">
          <CommandEmpty>No results</CommandEmpty>
        </CommandList>
      </Command>,
    );
    const input = screen.getByPlaceholderText("Search…");
    expect(getClasses(input)).toContain("placeholder:text-muted-foreground");
  });

  it("AC-CMD-02: has bg-transparent class", () => {
    render(
      <Command>
        <CommandInput placeholder="Search…" />
        <CommandList aria-label="results">
          <CommandEmpty>No results</CommandEmpty>
        </CommandList>
      </Command>,
    );
    const input = screen.getByPlaceholderText("Search…");
    expect(getClasses(input)).toContain("bg-transparent");
  });
});

// ---------------------------------------------------------------------------
// AC-CMD-03–04: CommandItem selected state
// ---------------------------------------------------------------------------

describe("CommandItem — selected state classes", () => {
  it("AC-CMD-03: has data-[selected='true']:bg-accent class", () => {
    render(
      <Command>
        <CommandList aria-label="results">
          <CommandItem>Test item</CommandItem>
        </CommandList>
      </Command>,
    );
    const item = screen.getByRole("option", { name: "Test item" });
    expect(item.className).toContain("data-[selected='true']:bg-accent");
  });

  it("AC-CMD-04: has data-[selected=true]:text-accent-foreground class", () => {
    render(
      <Command>
        <CommandList aria-label="results">
          <CommandItem>Test item</CommandItem>
        </CommandList>
      </Command>,
    );
    const item = screen.getByRole("option", { name: "Test item" });
    expect(item.className).toContain("data-[selected=true]:text-accent-foreground");
  });
});

// ---------------------------------------------------------------------------
// AC-CMD-05: CommandGroup heading token
// ---------------------------------------------------------------------------

describe("CommandGroup — heading", () => {
  it("AC-CMD-05: CommandGroup element class string contains text-muted-foreground (for heading)", () => {
    render(
      <Command>
        <CommandList aria-label="results">
          <CommandGroup heading="Pages">
            <CommandItem>Dashboard</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );
    // cmdk renders a [cmdk-group] div that receives the full Tailwind class string
    // including the [&_[cmdk-group-heading]]:text-muted-foreground selector.
    const group = document.querySelector("[cmdk-group]") as HTMLElement;
    expect(group).toBeTruthy();
    expect(group.className).toContain("text-muted-foreground");
  });
});

// ---------------------------------------------------------------------------
// AC-CMD-06: CommandEmpty
// ---------------------------------------------------------------------------

describe("CommandEmpty", () => {
  it("AC-CMD-06: has py-6 class", () => {
    render(
      <Command>
        <CommandList aria-label="results">
          <CommandEmpty>No results found.</CommandEmpty>
        </CommandList>
      </Command>,
    );
    const empty = screen.getByText("No results found.");
    expect(getClasses(empty)).toContain("py-6");
  });

  it("AC-CMD-06: has text-center class", () => {
    render(
      <Command>
        <CommandList aria-label="results">
          <CommandEmpty>No results found.</CommandEmpty>
        </CommandList>
      </Command>,
    );
    const empty = screen.getByText("No results found.");
    expect(getClasses(empty)).toContain("text-center");
  });

  it("AC-CMD-06: has text-sm class", () => {
    render(
      <Command>
        <CommandList aria-label="results">
          <CommandEmpty>No results found.</CommandEmpty>
        </CommandList>
      </Command>,
    );
    const empty = screen.getByText("No results found.");
    expect(getClasses(empty)).toContain("text-sm");
  });
});

// ---------------------------------------------------------------------------
// AC-CMD-07: CommandShortcut
// ---------------------------------------------------------------------------

describe("CommandShortcut", () => {
  it("AC-CMD-07: has text-xs class", () => {
    render(
      <Command>
        <CommandList aria-label="results">
          <CommandItem>
            Action
            <CommandShortcut>⌘K</CommandShortcut>
          </CommandItem>
        </CommandList>
      </Command>,
    );
    const shortcut = screen.getByText("⌘K");
    expect(getClasses(shortcut)).toContain("text-xs");
  });

  it("AC-CMD-07: has text-muted-foreground class", () => {
    render(
      <Command>
        <CommandList aria-label="results">
          <CommandItem>
            Action
            <CommandShortcut>⌘K</CommandShortcut>
          </CommandItem>
        </CommandList>
      </Command>,
    );
    const shortcut = screen.getByText("⌘K");
    expect(getClasses(shortcut)).toContain("text-muted-foreground");
  });
});

// ---------------------------------------------------------------------------
// AC-CMD-08: CommandSeparator
// ---------------------------------------------------------------------------

describe("CommandSeparator", () => {
  it("AC-CMD-08: has bg-border class", () => {
    render(
      <Command>
        <CommandList aria-label="results">
          <CommandGroup heading="A">
            <CommandItem>Item A</CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="B">
            <CommandItem>Item B</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );
    const separator = document.querySelector("[cmdk-separator]") as HTMLElement;
    expect(separator).toBeTruthy();
    expect(getClasses(separator)).toContain("bg-border");
  });
});

// ---------------------------------------------------------------------------
// AC-CMD-10–12: ARIA attributes from cmdk
// ---------------------------------------------------------------------------

describe("Command — ARIA attributes", () => {
  it("AC-CMD-10: CommandInput has role=combobox", () => {
    render(
      <Command>
        <CommandInput placeholder="Search…" />
        <CommandList aria-label="results">
          <CommandEmpty>No results</CommandEmpty>
        </CommandList>
      </Command>,
    );
    const input = screen.getByPlaceholderText("Search…");
    expect(input).toHaveAttribute("role", "combobox");
  });

  it("AC-CMD-11: CommandList has role=listbox", () => {
    render(
      <Command>
        <CommandInput placeholder="Search…" />
        <CommandList aria-label="results">
          <CommandEmpty>No results</CommandEmpty>
        </CommandList>
      </Command>,
    );
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("AC-CMD-12: CommandItem has role=option", () => {
    render(
      <Command>
        <CommandList aria-label="results">
          <CommandItem>Option one</CommandItem>
        </CommandList>
      </Command>,
    );
    expect(screen.getByRole("option", { name: "Option one" })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// AC-CMD-13: axe-core audit
// ---------------------------------------------------------------------------

describe("Command — accessibility audit", () => {
  it("AC-CMD-13: passes axe-core with no violations", async () => {
    const { container } = render(
      <Command aria-label="Command palette">
        <CommandInput placeholder="Search…" />
        <CommandList aria-label="results">
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Pages">
            <CommandItem>
              Dashboard
              <CommandShortcut>⌘D</CommandShortcut>
            </CommandItem>
            <CommandItem>Settings</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
