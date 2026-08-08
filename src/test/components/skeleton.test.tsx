/**
 * Skeleton component tests
 * Spec: docs/implementation/03-components/skeleton-spec.md
 *
 * Tests cover:
 * - Visual/token: bg-muted class, animate-skeleton-pulse (not animate-pulse)
 * - Composition: className merge for shape/size customization
 * - PageSkeleton variants: list, detail, card-grid
 */

import { render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it } from "vitest";

import { PageSkeleton, Skeleton } from "@/components/ui/skeleton";

// ---------------------------------------------------------------------------
// AC-SKL-01: bg-muted token class
// ---------------------------------------------------------------------------

describe("Skeleton — token class", () => {
  it("AC-SKL-01: renders with bg-muted class", () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("bg-muted");
  });

  it("AC-SKL-04: does not use bg-primary hardcoded color", () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).not.toContain("bg-primary");
  });
});

// ---------------------------------------------------------------------------
// AC-SKL-02 / AC-SKL-03: animation class
// ---------------------------------------------------------------------------

describe("Skeleton — animation class", () => {
  it("AC-SKL-02: uses animate-skeleton-pulse class", () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("animate-skeleton-pulse");
  });

  it("AC-SKL-03: does not use animate-pulse (Tailwind built-in)", () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    // Must NOT contain the bare Tailwind utility; animate-skeleton-pulse is allowed
    const classes = el.className.split(/\s+/);
    expect(classes).not.toContain("animate-pulse");
  });
});

// ---------------------------------------------------------------------------
// AC-SKL-05 / AC-SKL-06: className customization
// ---------------------------------------------------------------------------

describe("Skeleton — className customization", () => {
  it("AC-SKL-05: accepts rounded-full for circular shape", () => {
    const { container } = render(<Skeleton className="rounded-full" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("rounded-full");
  });

  it("AC-SKL-06: accepts h-10 w-10 for size customization", () => {
    const { container } = render(<Skeleton className="h-10 w-10" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("h-10");
    expect(el.className).toContain("w-10");
  });

  it("retains bg-muted when extra className is added", () => {
    const { container } = render(<Skeleton className="h-4 w-3/4" />);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("bg-muted");
    expect(el.className).toContain("animate-skeleton-pulse");
  });
});

// ---------------------------------------------------------------------------
// AC-SKL-07 / AC-SKL-08 / AC-SKL-09: PageSkeleton variants
// ---------------------------------------------------------------------------

describe("PageSkeleton — variants", () => {
  it("AC-SKL-07: list variant renders skeleton-list testid", () => {
    render(<PageSkeleton variant="list" />);
    expect(screen.getByTestId("skeleton-list")).toBeInTheDocument();
  });

  it("AC-SKL-07: list variant is the default", () => {
    render(<PageSkeleton />);
    expect(screen.getByTestId("skeleton-list")).toBeInTheDocument();
  });

  it("AC-SKL-08: detail variant renders skeleton-detail testid", () => {
    render(<PageSkeleton variant="detail" />);
    expect(screen.getByTestId("skeleton-detail")).toBeInTheDocument();
  });

  it("AC-SKL-09: card-grid variant renders skeleton-card-grid testid", () => {
    render(<PageSkeleton variant="card-grid" />);
    expect(screen.getByTestId("skeleton-card-grid")).toBeInTheDocument();
  });
});
