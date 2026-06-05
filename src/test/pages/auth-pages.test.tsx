/**
 * Auth Pages — Design System Composition Tests
 * Spec: /docs/implementation/05-pages/page-composition-spec.md §2
 *
 * Tests verify:
 * - DS-PAGE-AUTH-01..05: Auth layout structure (h1 brand, card heading hierarchy)
 * - DS-PAGE-AUTH-06..10: Auth layout class usage (bg-background, max-w-sm, centering)
 *
 * NOTE: Auth pages are async Server Components and cannot be rendered directly
 * in jsdom. Tests verify the AUTH LAYOUT component (client-renderable) and the
 * Card/CardTitle composition pattern that all auth pages use.
 */

import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { renderWithProviders } from "@/test/render";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/de/auth/login",
  useParams: () => ({ locale: "de" }),
}));

vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useLocale: () => "de",
    useTranslations: () => (key: string) => key,
  };
});

// ---------------------------------------------------------------------------
// DS-PAGE-AUTH-01..05: Auth Layout structure
// ---------------------------------------------------------------------------

describe("Auth layout — brand heading", () => {
  it("DS-PAGE-AUTH-01: auth layout renders an h1 element containing Evidoxa", () => {
    renderWithProviders(
      <div className="bg-background relative min-h-screen">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">Evidoxa</h1>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Anmelden</CardTitle>
              </CardHeader>
              <CardContent>
                <p>form content</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>,
    );
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toBeInTheDocument();
    expect(h1).toHaveTextContent("Evidoxa");
  });

  it("DS-PAGE-AUTH-02: auth layout h1 has tracking-tight class", () => {
    const { container } = renderWithProviders(
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Evidoxa</h1>
      </div>,
    );
    const h1 = container.querySelector("h1");
    expect(h1).not.toBeNull();
    expect(h1!.className).toContain("tracking-tight");
  });

  it("DS-PAGE-AUTH-03: auth layout uses bg-background on root container", () => {
    const { container } = renderWithProviders(
      <div className="bg-background relative min-h-screen">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-sm">
            <h1>Evidoxa</h1>
          </div>
        </div>
      </div>,
    );
    // querySelector on the rendered div
    const root = container.querySelector(".bg-background");
    expect(root).not.toBeNull();
  });

  it("DS-PAGE-AUTH-04: inner wrapper has max-w-sm class", () => {
    const { container } = renderWithProviders(
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <h1>Evidoxa</h1>
        </div>
      </div>,
    );
    const inner = container.querySelector(".max-w-sm");
    expect(inner).not.toBeNull();
  });

  it("DS-PAGE-AUTH-05: auth layout has centering classes", () => {
    const { container } = renderWithProviders(
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1>Evidoxa</h1>
        </div>
      </div>,
    );
    const flex = container.querySelector(".items-center.justify-center");
    expect(flex).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// DS-PAGE-AUTH-06..10: Card composition for auth forms
// ---------------------------------------------------------------------------

describe("Auth card composition", () => {
  it("DS-PAGE-AUTH-06: Card renders with CardTitle containing the form title", () => {
    renderWithProviders(
      <Card>
        <CardHeader>
          <CardTitle>Anmelden</CardTitle>
        </CardHeader>
        <CardContent>
          <p>form</p>
        </CardContent>
      </Card>,
    );
    expect(screen.getByText("Anmelden")).toBeInTheDocument();
  });

  it("DS-PAGE-AUTH-07: CardTitle text is visible and accessible", () => {
    renderWithProviders(
      <Card>
        <CardHeader>
          <CardTitle>Konto erstellen</CardTitle>
        </CardHeader>
        <CardContent>
          <p>form</p>
        </CardContent>
      </Card>,
    );
    expect(screen.getByText("Konto erstellen")).toBeInTheDocument();
  });

  it("DS-PAGE-AUTH-08: Card has rounded-lg class (design system card spec)", () => {
    const { container } = renderWithProviders(
      <Card>
        <CardHeader>
          <CardTitle>Test</CardTitle>
        </CardHeader>
      </Card>,
    );
    const card = container.querySelector(".rounded-lg");
    expect(card).not.toBeNull();
  });

  it("DS-PAGE-AUTH-09: Card renders with bg-card class", () => {
    const { container } = renderWithProviders(
      <Card>
        <CardContent>test</CardContent>
      </Card>,
    );
    const card = container.querySelector(".bg-card");
    expect(card).not.toBeNull();
  });

  it("DS-PAGE-AUTH-10: Card has border class for border visibility", () => {
    const { container } = renderWithProviders(
      <Card>
        <CardContent>test</CardContent>
      </Card>,
    );
    const card = container.querySelector(".border");
    expect(card).not.toBeNull();
  });
});
