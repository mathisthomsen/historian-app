import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Helpers: render each sub-component and return its root DOM element
function renderCard(props: React.ComponentProps<typeof Card> = {}) {
  const { container } = render(<Card {...props} />);
  return container.firstChild as HTMLElement;
}

function renderCardHeader(props: React.ComponentProps<typeof CardHeader> = {}) {
  const { container } = render(<CardHeader {...props} />);
  return container.firstChild as HTMLElement;
}

function renderCardTitle(props: React.ComponentProps<typeof CardTitle> = {}) {
  const { container } = render(<CardTitle {...props} />);
  return container.firstChild as HTMLElement;
}

function renderCardDescription(props: React.ComponentProps<typeof CardDescription> = {}) {
  const { container } = render(<CardDescription {...props} />);
  return container.firstChild as HTMLElement;
}

function renderCardContent(props: React.ComponentProps<typeof CardContent> = {}) {
  const { container } = render(<CardContent {...props} />);
  return container.firstChild as HTMLElement;
}

function renderCardFooter(props: React.ComponentProps<typeof CardFooter> = {}) {
  const { container } = render(<CardFooter {...props} />);
  return container.firstChild as HTMLElement;
}

// ---------------------------------------------------------------------------
// AC-CARD-01 / AC-CARD-02: surface tokens
// ---------------------------------------------------------------------------
describe("Card surface tokens", () => {
  it("AC-CARD-01: renders with bg-card class", () => {
    const el = renderCard({ children: null });
    expect(el.className).toContain("bg-card");
  });

  it("AC-CARD-02: renders with text-card-foreground class", () => {
    const el = renderCard({ children: null });
    expect(el.className).toContain("text-card-foreground");
  });
});

// ---------------------------------------------------------------------------
// AC-CARD-03: border uses semantic token, not hardcoded color
// ---------------------------------------------------------------------------
describe("Card border", () => {
  it("AC-CARD-03: renders with border-border class (semantic token)", () => {
    const el = renderCard({ children: null });
    expect(el.className).toContain("border-border");
  });

  it("AC-CARD-03: does not use a hardcoded hex or hsl color in className", () => {
    const el = renderCard({ children: null });
    // Ensure no raw color value is hardcoded in the class string
    expect(el.className).not.toMatch(/border-\[#/);
    expect(el.className).not.toMatch(/border-\[hsl/);
  });
});

// ---------------------------------------------------------------------------
// AC-CARD-04: radius
// ---------------------------------------------------------------------------
describe("Card radius", () => {
  it("AC-CARD-04: renders with rounded-lg class", () => {
    const el = renderCard({ children: null });
    expect(el.className).toContain("rounded-lg");
  });

  it("AC-CARD-17: base Card does not include rounded-xl (that is consumer-applied)", () => {
    const el = renderCard({ children: null });
    expect(el.className).not.toContain("rounded-xl");
  });
});

// ---------------------------------------------------------------------------
// AC-CARD-05: no shadow — DS mandates borders-only, no elevation shadow on cards
// ---------------------------------------------------------------------------
describe("Card shadow", () => {
  it("AC-CARD-05: does not render with shadow-sm class (borders-only per DS spec)", () => {
    const el = renderCard({ children: null });
    expect(el.className).not.toContain("shadow-sm");
  });

  it("AC-CARD-05: does not contain bare shadow class", () => {
    const el = renderCard({ children: null });
    // Split on whitespace and look for an exact "shadow" token (not "shadow-sm", "shadow-md" etc.)
    const classes = el.className.split(/\s+/);
    expect(classes).not.toContain("shadow");
  });
});

// ---------------------------------------------------------------------------
// AC-CARD-06 / AC-CARD-07: CardTitle typography
// ---------------------------------------------------------------------------
describe("CardTitle", () => {
  it("AC-CARD-06: renders with font-semibold class", () => {
    const el = renderCardTitle({ children: "Title" });
    expect(el.className).toContain("font-semibold");
  });

  it("AC-CARD-07: renders with text-lg class", () => {
    const el = renderCardTitle({ children: "Title" });
    expect(el.className).toContain("text-lg");
  });

  it("renders with leading-none class", () => {
    const el = renderCardTitle({ children: "Title" });
    expect(el.className).toContain("leading-none");
  });

  it("renders with tracking-tight class", () => {
    const el = renderCardTitle({ children: "Title" });
    expect(el.className).toContain("tracking-tight");
  });
});

// ---------------------------------------------------------------------------
// AC-CARD-08 / AC-CARD-09: CardDescription
// ---------------------------------------------------------------------------
describe("CardDescription", () => {
  it("AC-CARD-08: renders with text-muted-foreground class", () => {
    const el = renderCardDescription({ children: "Description" });
    expect(el.className).toContain("text-muted-foreground");
  });

  it("AC-CARD-09: renders with text-sm class", () => {
    const el = renderCardDescription({ children: "Description" });
    expect(el.className).toContain("text-sm");
  });
});

// ---------------------------------------------------------------------------
// AC-CARD-10: CardContent padding
// ---------------------------------------------------------------------------
describe("CardContent", () => {
  it("AC-CARD-10: renders with p-6 class", () => {
    const el = renderCardContent({ children: null });
    expect(el.className).toContain("p-6");
  });

  it("AC-CARD-10: renders with pt-0 class", () => {
    const el = renderCardContent({ children: null });
    expect(el.className).toContain("pt-0");
  });
});

// ---------------------------------------------------------------------------
// AC-CARD-11: CardFooter layout
// ---------------------------------------------------------------------------
describe("CardFooter", () => {
  it("AC-CARD-11: renders with flex class", () => {
    const el = renderCardFooter({ children: null });
    expect(el.className).toContain("flex");
  });

  it("AC-CARD-11: renders with items-center class", () => {
    const el = renderCardFooter({ children: null });
    expect(el.className).toContain("items-center");
  });

  it("AC-CARD-11: renders with p-6 class", () => {
    const el = renderCardFooter({ children: null });
    expect(el.className).toContain("p-6");
  });

  it("AC-CARD-11: renders with pt-0 class", () => {
    const el = renderCardFooter({ children: null });
    expect(el.className).toContain("pt-0");
  });
});

// ---------------------------------------------------------------------------
// AC-CARD-12: CardHeader padding
// ---------------------------------------------------------------------------
describe("CardHeader", () => {
  it("AC-CARD-12: renders with p-6 class", () => {
    const el = renderCardHeader({ children: null });
    expect(el.className).toContain("p-6");
  });

  it("renders with flex flex-col space-y-1.5 classes", () => {
    const el = renderCardHeader({ children: null });
    expect(el.className).toContain("flex");
    expect(el.className).toContain("flex-col");
    expect(el.className).toContain("space-y-1.5");
  });
});

// ---------------------------------------------------------------------------
// AC-CARD-13 / AC-CARD-14: className merging
// ---------------------------------------------------------------------------
describe("className merging", () => {
  it("AC-CARD-13: Card merges custom className with base classes", () => {
    const el = renderCard({ className: "opacity-50", children: null });
    expect(el.className).toContain("opacity-50");
    expect(el.className).toContain("bg-card");
  });

  it("AC-CARD-14: CardContent merges custom className with base classes", () => {
    // Use a non-padding class so tailwind-merge does not strip pt-0
    const el = renderCardContent({ className: "overflow-hidden", children: null });
    expect(el.className).toContain("overflow-hidden");
    expect(el.className).toContain("pt-0");
    expect(el.className).toContain("p-6");
  });
});

// ---------------------------------------------------------------------------
// AC-CARD-15: children passthrough on all sub-components
// ---------------------------------------------------------------------------
describe("children passthrough", () => {
  it("AC-CARD-15: Card renders children", () => {
    render(<Card>card-child</Card>);
    expect(screen.getByText("card-child")).toBeInTheDocument();
  });

  it("AC-CARD-15: CardHeader renders children", () => {
    render(<CardHeader>header-child</CardHeader>);
    expect(screen.getByText("header-child")).toBeInTheDocument();
  });

  it("AC-CARD-15: CardTitle renders children", () => {
    render(<CardTitle>title-child</CardTitle>);
    expect(screen.getByText("title-child")).toBeInTheDocument();
  });

  it("AC-CARD-15: CardDescription renders children", () => {
    render(<CardDescription>desc-child</CardDescription>);
    expect(screen.getByText("desc-child")).toBeInTheDocument();
  });

  it("AC-CARD-15: CardContent renders children", () => {
    render(<CardContent>content-child</CardContent>);
    expect(screen.getByText("content-child")).toBeInTheDocument();
  });

  it("AC-CARD-15: CardFooter renders children", () => {
    render(<CardFooter>footer-child</CardFooter>);
    expect(screen.getByText("footer-child")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// AC-CARD-16: props passthrough via ...props
// ---------------------------------------------------------------------------
describe("props passthrough", () => {
  it("AC-CARD-16: Card passes data-testid through to the DOM element", () => {
    render(<Card data-testid="my-card">test</Card>);
    expect(screen.getByTestId("my-card")).toBeInTheDocument();
  });

  it("AC-CARD-16: CardContent passes data-testid through", () => {
    render(<CardContent data-testid="my-content">test</CardContent>);
    expect(screen.getByTestId("my-content")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Full composition smoke test
// ---------------------------------------------------------------------------
describe("full composition", () => {
  it("renders a complete card with all sub-components", () => {
    render(
      <Card data-testid="full-card">
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test description text.</CardDescription>
        </CardHeader>
        <CardContent>Main content area</CardContent>
        <CardFooter>Footer actions</CardFooter>
      </Card>,
    );

    expect(screen.getByTestId("full-card")).toBeInTheDocument();
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test description text.")).toBeInTheDocument();
    expect(screen.getByText("Main content area")).toBeInTheDocument();
    expect(screen.getByText("Footer actions")).toBeInTheDocument();
  });
});
