/**
 * Alert component tests
 * Spec: docs/implementation/03-components/alert-spec.md
 *
 * Tests cover:
 * - Visual/token: variant class output (default, destructive, success, warning)
 * - AlertTitle and AlertDescription classes
 * - ARIA: role="alert" on container
 * - axe-core accessibility audit
 */

import * as React from "react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { render, screen } from "../render";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getClasses(element: HTMLElement): string[] {
  return element.className.split(/\s+/).filter(Boolean);
}

// ---------------------------------------------------------------------------
// AC-AL-01–03: Default (info) variant
// ---------------------------------------------------------------------------

describe("Alert — default (info) variant", () => {
  it("AC-AL-01: has bg-info-background class", () => {
    render(<Alert>Info message</Alert>);
    const alert = screen.getByRole("alert");
    expect(getClasses(alert)).toContain("bg-info-background");
  });

  it("AC-AL-02: has border-info-border class", () => {
    render(<Alert>Info message</Alert>);
    const alert = screen.getByRole("alert");
    expect(getClasses(alert)).toContain("border-info-border");
  });

  it("AC-AL-03: has text-info-foreground class", () => {
    render(<Alert>Info message</Alert>);
    const alert = screen.getByRole("alert");
    expect(getClasses(alert)).toContain("text-info-foreground");
  });
});

// ---------------------------------------------------------------------------
// AC-AL-04–06: Destructive variant
// ---------------------------------------------------------------------------

describe("Alert — destructive variant", () => {
  it("AC-AL-04: has bg-destructive-background class", () => {
    render(<Alert variant="destructive">Destructive message</Alert>);
    const alert = screen.getByRole("alert");
    expect(getClasses(alert)).toContain("bg-destructive-background");
  });

  it("AC-AL-05: has border-destructive-border class", () => {
    render(<Alert variant="destructive">Destructive message</Alert>);
    const alert = screen.getByRole("alert");
    expect(getClasses(alert)).toContain("border-destructive-border");
  });

  it("AC-AL-06: has text-destructive-foreground class", () => {
    render(<Alert variant="destructive">Destructive message</Alert>);
    const alert = screen.getByRole("alert");
    expect(getClasses(alert)).toContain("text-destructive-foreground");
  });
});

// ---------------------------------------------------------------------------
// AC-AL-07–09: Success variant
// ---------------------------------------------------------------------------

describe("Alert — success variant", () => {
  it("AC-AL-07: has bg-success-background class", () => {
    render(<Alert variant="success">Success message</Alert>);
    const alert = screen.getByRole("alert");
    expect(getClasses(alert)).toContain("bg-success-background");
  });

  it("AC-AL-08: has border-success-border class", () => {
    render(<Alert variant="success">Success message</Alert>);
    const alert = screen.getByRole("alert");
    expect(getClasses(alert)).toContain("border-success-border");
  });

  it("AC-AL-09: has text-success-foreground class", () => {
    render(<Alert variant="success">Success message</Alert>);
    const alert = screen.getByRole("alert");
    expect(getClasses(alert)).toContain("text-success-foreground");
  });
});

// ---------------------------------------------------------------------------
// AC-AL-10–12: Warning variant
// ---------------------------------------------------------------------------

describe("Alert — warning variant", () => {
  it("AC-AL-10: has bg-warning-background class", () => {
    render(<Alert variant="warning">Warning message</Alert>);
    const alert = screen.getByRole("alert");
    expect(getClasses(alert)).toContain("bg-warning-background");
  });

  it("AC-AL-11: has border-warning-border class", () => {
    render(<Alert variant="warning">Warning message</Alert>);
    const alert = screen.getByRole("alert");
    expect(getClasses(alert)).toContain("border-warning-border");
  });

  it("AC-AL-12: has text-warning-foreground class", () => {
    render(<Alert variant="warning">Warning message</Alert>);
    const alert = screen.getByRole("alert");
    expect(getClasses(alert)).toContain("text-warning-foreground");
  });
});

// ---------------------------------------------------------------------------
// AC-AL-13–14: AlertTitle and AlertDescription
// ---------------------------------------------------------------------------

describe("Alert — sub-components", () => {
  it("AC-AL-13: AlertTitle has font-semibold class", () => {
    render(
      <Alert>
        <AlertTitle>Title here</AlertTitle>
      </Alert>,
    );
    const title = screen.getByText("Title here");
    expect(getClasses(title)).toContain("font-semibold");
  });

  it("AC-AL-14: AlertDescription has text-sm class", () => {
    render(
      <Alert>
        <AlertDescription>Description here</AlertDescription>
      </Alert>,
    );
    const desc = screen.getByText("Description here");
    expect(getClasses(desc)).toContain("text-sm");
  });
});

// ---------------------------------------------------------------------------
// AC-AL-15: ARIA role
// ---------------------------------------------------------------------------

describe("Alert — ARIA", () => {
  it("AC-AL-15: container has role='alert'", () => {
    render(<Alert>Any message</Alert>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// AC-AL-16: axe-core audit
// ---------------------------------------------------------------------------

describe("Alert — accessibility audit", () => {
  it("AC-AL-16: passes axe-core with no violations", async () => {
    const { container } = render(
      <Alert>
        <AlertTitle>Server error</AlertTitle>
        <AlertDescription>Could not connect to the database. Please retry.</AlertDescription>
      </Alert>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
