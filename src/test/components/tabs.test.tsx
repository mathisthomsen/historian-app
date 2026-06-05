/**
 * Tabs component tests
 * Spec: docs/implementation/03-components/tabs-spec.md
 *
 * Tests cover:
 * - Visual/token: class output for TabsList, TabsTrigger, TabsContent
 * - State: active vs inactive trigger classes
 * - Accessibility: ARIA roles, aria-selected, axe-core
 * - Keyboard navigation: ArrowRight/ArrowLeft between triggers
 * - Interaction: disabled trigger prevention
 */

import userEvent from "@testing-library/user-event";
import * as React from "react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { render, screen, fireEvent } from "../render";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getClasses(element: HTMLElement): string[] {
  return element.className.split(/\s+/).filter(Boolean);
}

function renderTabs(opts: { disabled?: boolean; defaultValue?: string } = {}) {
  const defaultValue = opts.defaultValue ?? "tab1";
  return render(
    <Tabs defaultValue={defaultValue}>
      <TabsList>
        <TabsTrigger value="tab1" disabled={opts.disabled}>
          Tab One
        </TabsTrigger>
        <TabsTrigger value="tab2">Tab Two</TabsTrigger>
        <TabsTrigger value="tab3">Tab Three</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Content One</TabsContent>
      <TabsContent value="tab2">Content Two</TabsContent>
      <TabsContent value="tab3">Content Three</TabsContent>
    </Tabs>,
  );
}

// ---------------------------------------------------------------------------
// AC-TABS-01..04: TabsList classes
// ---------------------------------------------------------------------------

describe("Tabs — TabsList classes", () => {
  it("AC-TABS-01: has border-b class (underline tab style)", () => {
    renderTabs();
    const list = screen.getByRole("tablist");
    expect(getClasses(list)).toContain("border-b");
  });

  it("AC-TABS-02: has border-border class (semantic token)", () => {
    renderTabs();
    const list = screen.getByRole("tablist");
    expect(getClasses(list)).toContain("border-border");
  });

  it("AC-TABS-03: has w-full class", () => {
    renderTabs();
    const list = screen.getByRole("tablist");
    expect(getClasses(list)).toContain("w-full");
  });

  it("AC-TABS-04: has h-10 class", () => {
    renderTabs();
    const list = screen.getByRole("tablist");
    expect(getClasses(list)).toContain("h-10");
  });
});

// ---------------------------------------------------------------------------
// AC-TABS-05..08: TabsTrigger state classes
// ---------------------------------------------------------------------------

describe("Tabs — TabsTrigger inactive state", () => {
  it("AC-TABS-05: inactive trigger has text-muted-foreground class", () => {
    renderTabs();
    const tabs = screen.getAllByRole("tab");
    const inactiveTab = tabs[1]!; // tab2 is inactive when defaultValue=tab1
    expect(getClasses(inactiveTab)).toContain("text-muted-foreground");
  });
});

describe("Tabs — TabsTrigger active state", () => {
  it("AC-TABS-06: active trigger has data-[state=active]:border-primary class (underline indicator)", () => {
    renderTabs();
    const tabs = screen.getAllByRole("tab");
    const activeTab = tabs[0]!; // tab1 is active
    expect(activeTab).toHaveAttribute("data-state", "active");
    expect(getClasses(activeTab)).toContain("data-[state=active]:border-primary");
  });

  it("AC-TABS-07: active trigger has data-[state=active]:text-foreground class", () => {
    renderTabs();
    const tabs = screen.getAllByRole("tab");
    const activeTab = tabs[0]!;
    expect(getClasses(activeTab)).toContain("data-[state=active]:text-foreground");
  });

  it("AC-TABS-08: trigger has border-b-2 class (underline indicator base)", () => {
    renderTabs();
    const tabs = screen.getAllByRole("tab");
    const activeTab = tabs[0]!;
    expect(getClasses(activeTab)).toContain("border-b-2");
  });
});

// ---------------------------------------------------------------------------
// AC-TABS-09..15: TabsTrigger base classes
// ---------------------------------------------------------------------------

describe("Tabs — TabsTrigger base classes", () => {
  it("AC-TABS-09: has text-sm class", () => {
    renderTabs();
    const tab = screen.getAllByRole("tab")[0]!;
    expect(getClasses(tab)).toContain("text-sm");
  });

  it("AC-TABS-10: has font-medium class", () => {
    renderTabs();
    const tab = screen.getAllByRole("tab")[0]!;
    expect(getClasses(tab)).toContain("font-medium");
  });

  it("AC-TABS-11: has transition-colors class", () => {
    renderTabs();
    const tab = screen.getAllByRole("tab")[0]!;
    expect(getClasses(tab)).toContain("transition-colors");
  });

  it("AC-TABS-12: has focus-visible:ring-2 class", () => {
    renderTabs();
    const tab = screen.getAllByRole("tab")[0]!;
    expect(getClasses(tab)).toContain("focus-visible:ring-2");
  });

  it("AC-TABS-13: has focus-visible:ring-ring class", () => {
    renderTabs();
    const tab = screen.getAllByRole("tab")[0]!;
    expect(getClasses(tab)).toContain("focus-visible:ring-ring");
  });

  it("AC-TABS-14: has disabled:pointer-events-none class", () => {
    renderTabs();
    const tab = screen.getAllByRole("tab")[0]!;
    expect(getClasses(tab)).toContain("disabled:pointer-events-none");
  });

  it("AC-TABS-15: has disabled:opacity-50 class", () => {
    renderTabs();
    const tab = screen.getAllByRole("tab")[0]!;
    expect(getClasses(tab)).toContain("disabled:opacity-50");
  });

  it("AC-TABS-26: has py-2.5 class", () => {
    renderTabs();
    const tab = screen.getAllByRole("tab")[0]!;
    expect(getClasses(tab)).toContain("py-2.5");
  });

  it("AC-TABS-27: has px-4 class", () => {
    renderTabs();
    const tab = screen.getAllByRole("tab")[0]!;
    expect(getClasses(tab)).toContain("px-4");
  });

  it("AC-TABS-28: does not have rounded-md class (underline tabs are not pill-shaped)", () => {
    renderTabs();
    const tab = screen.getAllByRole("tab")[0]!;
    expect(getClasses(tab)).not.toContain("rounded-md");
  });
});

// ---------------------------------------------------------------------------
// AC-TABS-25: TabsContent classes
// ---------------------------------------------------------------------------

describe("Tabs — TabsContent classes", () => {
  it("AC-TABS-25: has mt-2 class", () => {
    renderTabs();
    // TabsContent for the active tab is in the DOM
    const panel = screen.getByRole("tabpanel");
    expect(getClasses(panel)).toContain("mt-2");
  });
});

// ---------------------------------------------------------------------------
// AC-TABS-16..20: ARIA roles and attributes
// ---------------------------------------------------------------------------

describe("Tabs — ARIA roles", () => {
  it("AC-TABS-16: TabsList has role=tablist", () => {
    renderTabs();
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("AC-TABS-17: TabsTrigger has role=tab", () => {
    renderTabs();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.length).toBe(3);
  });

  it("AC-TABS-18: TabsContent has role=tabpanel", () => {
    renderTabs();
    expect(screen.getByRole("tabpanel")).toBeInTheDocument();
  });

  it("AC-TABS-19: active trigger has aria-selected=true", () => {
    renderTabs();
    const activeTab = screen.getByRole("tab", { name: "Tab One" });
    expect(activeTab).toHaveAttribute("aria-selected", "true");
  });

  it("AC-TABS-20: inactive trigger has aria-selected=false", () => {
    renderTabs();
    const inactiveTab = screen.getByRole("tab", { name: "Tab Two" });
    expect(inactiveTab).toHaveAttribute("aria-selected", "false");
  });
});

// ---------------------------------------------------------------------------
// AC-TABS-21..22: Keyboard navigation
// ---------------------------------------------------------------------------

describe("Tabs — keyboard navigation", () => {
  it("AC-TABS-21: ArrowRight moves focus to next tab trigger", async () => {
    const user = userEvent.setup();
    renderTabs();
    const tabs = screen.getAllByRole("tab");

    // Focus first tab, then press ArrowRight
    await user.click(tabs[0]!);
    await user.keyboard("{ArrowRight}");

    expect(document.activeElement).toBe(tabs[1]!);
  });

  it("AC-TABS-22: ArrowLeft moves focus to previous tab trigger", async () => {
    const user = userEvent.setup();
    renderTabs();
    const tabs = screen.getAllByRole("tab");

    // Focus second tab, then press ArrowLeft
    await user.click(tabs[1]!);
    await user.keyboard("{ArrowLeft}");

    expect(document.activeElement).toBe(tabs[0]!);
  });
});

// ---------------------------------------------------------------------------
// AC-TABS-23: Disabled trigger
// ---------------------------------------------------------------------------

describe("Tabs — disabled trigger", () => {
  it("AC-TABS-23: disabled trigger is not activatable by click", () => {
    render(
      <Tabs defaultValue="tab2">
        <TabsList>
          <TabsTrigger value="tab1" disabled>
            Disabled Tab
          </TabsTrigger>
          <TabsTrigger value="tab2">Active Tab</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content One</TabsContent>
        <TabsContent value="tab2">Content Two</TabsContent>
      </Tabs>,
    );

    const disabledTab = screen.getByRole("tab", { name: "Disabled Tab" });
    expect(disabledTab).toBeDisabled();

    // Click should not change the selected tab
    fireEvent.click(disabledTab);
    expect(disabledTab).toHaveAttribute("aria-selected", "false");

    // Active tab remains unchanged
    const activeTab = screen.getByRole("tab", { name: "Active Tab" });
    expect(activeTab).toHaveAttribute("aria-selected", "true");
  });
});

// ---------------------------------------------------------------------------
// AC-TABS-24: axe-core accessibility
// ---------------------------------------------------------------------------

describe("Tabs — axe accessibility", () => {
  it("AC-TABS-24: full Tabs structure passes axe with no violations", async () => {
    const { container } = renderTabs();
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });

  it("Tabs with count badge passes axe", async () => {
    const { container } = render(
      <Tabs defaultValue="relations">
        <TabsList>
          <TabsTrigger value="attributes">Attributes</TabsTrigger>
          <TabsTrigger value="relations" aria-label="Relations, 12 items">
            Relations
            <span className="bg-muted text-muted-foreground ml-1.5 rounded-full px-1.5 py-0.5 font-mono text-xs tabular-nums">
              12
            </span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="attributes">Attributes content</TabsContent>
        <TabsContent value="relations">Relations content</TabsContent>
      </Tabs>,
    );
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
