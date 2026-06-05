/**
 * Breadcrumb component tests
 * Spec: docs/implementation/03-components/breadcrumb-spec.md
 *
 * Tests cover:
 * - Accessibility: ARIA roles, labels, current page, separator hidden
 * - Visual/token: class output for link, current, separator
 * - Keyboard: focusability of links
 * - Composition: BreadcrumbEllipsis, asChild
 * - axe-core audit
 */

import * as React from "react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { render, screen } from "../render";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getClasses(element: HTMLElement): string[] {
  return element.className.split(/\s+/).filter(Boolean);
}

/** Renders a two-segment breadcrumb: "Persons > Johann Wolfgang" */
function renderBasic() {
  return render(
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/de/persons">Persons</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Johann Wolfgang</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>,
  );
}

// ---------------------------------------------------------------------------
// AC-BC-01: Container is <nav> with aria-label="Breadcrumb"
// ---------------------------------------------------------------------------

describe("Breadcrumb — container", () => {
  it("AC-BC-01: renders a <nav> element", () => {
    renderBasic();
    const nav = screen.getByRole("navigation");
    expect(nav.tagName).toBe("NAV");
  });

  it("AC-BC-01: nav has aria-label='Breadcrumb'", () => {
    renderBasic();
    // getByRole with accessible name — case-insensitive search
    const nav = screen.getByRole("navigation", { name: /breadcrumb/i });
    expect(nav).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// AC-BC-02: List is <ol>
// ---------------------------------------------------------------------------

describe("Breadcrumb — list", () => {
  it("AC-BC-02: BreadcrumbList renders an <ol>", () => {
    renderBasic();
    const list = screen.getByRole("list");
    expect(list.tagName).toBe("OL");
  });
});

// ---------------------------------------------------------------------------
// AC-BC-03–05: BreadcrumbLink classes
// ---------------------------------------------------------------------------

describe("Breadcrumb — link classes", () => {
  it("AC-BC-03: link has text-muted-foreground class", () => {
    renderBasic();
    const link = screen.getByRole("link", { name: "Persons" });
    expect(getClasses(link)).toContain("text-muted-foreground");
  });

  it("AC-BC-04: link has hover:text-foreground class", () => {
    renderBasic();
    const link = screen.getByRole("link", { name: "Persons" });
    expect(getClasses(link)).toContain("hover:text-foreground");
  });

  it("AC-BC-05: link has transition-colors class", () => {
    renderBasic();
    const link = screen.getByRole("link", { name: "Persons" });
    expect(getClasses(link)).toContain("transition-colors");
  });
});

// ---------------------------------------------------------------------------
// AC-BC-06–08: BreadcrumbPage (current segment)
// ---------------------------------------------------------------------------

describe("Breadcrumb — current page", () => {
  it("AC-BC-06: current page has aria-current='page'", () => {
    renderBasic();
    const page = screen.getByText("Johann Wolfgang");
    expect(page).toHaveAttribute("aria-current", "page");
  });

  it("AC-BC-07: current page has text-foreground class", () => {
    renderBasic();
    const page = screen.getByText("Johann Wolfgang");
    expect(getClasses(page)).toContain("text-foreground");
  });

  it("AC-BC-08: current page has font-medium class", () => {
    renderBasic();
    const page = screen.getByText("Johann Wolfgang");
    expect(getClasses(page)).toContain("font-medium");
  });
});

// ---------------------------------------------------------------------------
// AC-BC-09–11: BreadcrumbSeparator
// ---------------------------------------------------------------------------

describe("Breadcrumb — separator", () => {
  it("AC-BC-09: separator li has aria-hidden='true'", () => {
    const { container } = renderBasic();
    // separator is role="presentation" aria-hidden="true" — query by aria-hidden
    const separator = container.querySelector("li[aria-hidden='true']");
    expect(separator).toBeInTheDocument();
  });

  it("AC-BC-10: separator renders a ChevronRight svg by default", () => {
    const { container } = renderBasic();
    const separator = container.querySelector("li[aria-hidden='true']");
    expect(separator?.querySelector("svg")).toBeInTheDocument();
  });

  it("AC-BC-11: separator has text-muted-foreground/60 class", () => {
    const { container } = renderBasic();
    const separator = container.querySelector("li[aria-hidden='true']") as HTMLElement;
    // Tailwind opacity modifier class
    expect(separator.className).toContain("text-muted-foreground/60");
  });
});

// ---------------------------------------------------------------------------
// AC-BC-12: BreadcrumbEllipsis
// ---------------------------------------------------------------------------

describe("Breadcrumb — ellipsis", () => {
  it("AC-BC-12: BreadcrumbEllipsis renders with sr-only text", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/de/persons">Persons</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    // sr-only span inside ellipsis
    expect(screen.getByText("More")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// AC-BC-13: Keyboard focusability
// ---------------------------------------------------------------------------

describe("Breadcrumb — keyboard", () => {
  it("AC-BC-13: link segments are keyboard-focusable", () => {
    renderBasic();
    const link = screen.getByRole("link", { name: "Persons" });
    expect(link).not.toHaveAttribute("tabindex", "-1");
    // <a href> elements are natively focusable
    link.focus();
    expect(link).toHaveFocus();
  });
});

// ---------------------------------------------------------------------------
// AC-BC-14: axe-core audit
// ---------------------------------------------------------------------------

describe("Breadcrumb — accessibility audit", () => {
  it("AC-BC-14: passes axe-core with no violations", async () => {
    const { container } = renderBasic();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
