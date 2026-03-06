import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import { AppShell } from "./app-shell";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/de",
  useParams: () => ({ locale: "de" }),
}));

vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useLocale: () => "de",
  };
});

describe("AppShell", () => {
  it("renders children in the main content area", () => {
    renderWithProviders(
      <AppShell>
        <div data-testid="page-content">Hello World</div>
      </AppShell>,
    );
    expect(screen.getByTestId("page-content")).toBeInTheDocument();
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("renders the top bar", () => {
    renderWithProviders(<AppShell>content</AppShell>);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("renders the navigation sidebar", () => {
    renderWithProviders(<AppShell>content</AppShell>);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("renders nav items in the sidebar", () => {
    renderWithProviders(<AppShell>content</AppShell>);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Personen")).toBeInTheDocument();
  });
});
