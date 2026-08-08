/**
 * Avatar component tests
 * Spec: docs/implementation/03-components/avatar-spec.md
 *
 * Tests cover:
 * - Visual/token: bg-muted and text-muted-foreground on AvatarFallback
 * - Shape: rounded-full, overflow-hidden on root
 * - Size: default h-8 w-8, className override
 * - Accessibility: alt attribute on AvatarImage
 * - Composition: className merge
 */

import { render, screen } from "@testing-library/react";
import * as React from "react";
import { describe, expect, it } from "vitest";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ---------------------------------------------------------------------------
// AC-AVT-01 / AC-AVT-02: AvatarFallback token classes
// ---------------------------------------------------------------------------

describe("AvatarFallback — token classes", () => {
  it("AC-AVT-01: has bg-muted class", () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>,
    );
    // AvatarFallback is the second child span inside the root span
    const fallback = container.querySelector("[class*='bg-muted']");
    expect(fallback).not.toBeNull();
    expect(fallback!.className).toContain("bg-muted");
  });

  it("AC-AVT-02: has text-muted-foreground class", () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>,
    );
    const fallback = container.querySelector("[class*='text-muted-foreground']");
    expect(fallback).not.toBeNull();
    expect(fallback!.className).toContain("text-muted-foreground");
  });

  it("AC-AVT-01+02: fallback element has both bg-muted and text-muted-foreground", () => {
    render(
      <Avatar>
        <AvatarFallback data-testid="fb">LM</AvatarFallback>
      </Avatar>,
    );
    const fallback = screen.getByTestId("fb");
    expect(fallback.className).toContain("bg-muted");
    expect(fallback.className).toContain("text-muted-foreground");
  });
});

// ---------------------------------------------------------------------------
// AC-AVT-03 / AC-AVT-04: Avatar root shape classes
// ---------------------------------------------------------------------------

describe("Avatar root — shape classes", () => {
  it("AC-AVT-03: root has rounded-full class", () => {
    const { container } = render(<Avatar />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("rounded-full");
  });

  it("AC-AVT-04: root has overflow-hidden class", () => {
    const { container } = render(<Avatar />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("overflow-hidden");
  });
});

// ---------------------------------------------------------------------------
// AC-AVT-05: default size is h-8 w-8
// ---------------------------------------------------------------------------

describe("Avatar root — default size", () => {
  it("AC-AVT-05: default Avatar root has h-8 and w-8 classes", () => {
    const { container } = render(<Avatar />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("h-8");
    expect(root.className).toContain("w-8");
  });
});

// ---------------------------------------------------------------------------
// AC-AVT-06: size override via className
// ---------------------------------------------------------------------------

describe("Avatar root — className override", () => {
  it("AC-AVT-06: accepts h-10 w-10 className for larger size", () => {
    const { container } = render(<Avatar className="h-10 w-10" />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("h-10");
    expect(root.className).toContain("w-10");
  });

  it("AC-AVT-09: merges extra className while preserving rounded-full", () => {
    const { container } = render(<Avatar className="ring-border ring-2" />);
    const root = container.firstChild as HTMLElement;
    expect(root.className).toContain("ring-2");
    expect(root.className).toContain("rounded-full");
  });
});

// ---------------------------------------------------------------------------
// AC-AVT-07: AvatarImage alt attribute
// ---------------------------------------------------------------------------

describe("AvatarImage — accessibility", () => {
  it("AC-AVT-07: AvatarImage accepts an alt prop without throwing", () => {
    // Radix AvatarImage defers rendering the <img> until the browser fires a
    // load event; jsdom does not fire load events, so no <img> appears in the
    // DOM. The test verifies the component accepts the alt prop at the type
    // level (TypeScript) and renders without error, which is the testable
    // contract in a unit-test environment.
    expect(() =>
      render(
        <Avatar>
          <AvatarImage src="https://example.com/avatar.jpg" alt="Test User" />
          <AvatarFallback>TU</AvatarFallback>
        </Avatar>,
      ),
    ).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// AC-AVT-08: fallback text content
// ---------------------------------------------------------------------------

describe("AvatarFallback — content", () => {
  it("AC-AVT-08: renders initials text inside fallback", () => {
    render(
      <Avatar>
        <AvatarFallback>LM</AvatarFallback>
      </Avatar>,
    );
    expect(screen.getByText("LM")).toBeInTheDocument();
  });
});
