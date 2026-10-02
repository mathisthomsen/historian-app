import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PublicNav } from "@/components/marketing/PublicNav";

import { renderWithProviders } from "../render";

// LocaleSwitcher (rendered inside PublicNav) calls useRouter/usePathname from
// next/navigation, which requires an app-router context renderWithProviders
// does not mount. Mocked the same way as src/components/shell/app-shell.test.tsx
// and src/components/shell/locale-switcher.test.tsx.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/de",
  useParams: () => ({ locale: "de" }),
}));

describe("PublicNav", () => {
  it("offers sign-in and an access request to a guest", () => {
    renderWithProviders(<PublicNav isSignedIn={false} locale="de" />);
    expect(screen.getByRole("link", { name: /anmelden/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /zur app/i })).not.toBeInTheDocument();
  });

  it("sends a guest's access request to the landing page's form from any marketing page", () => {
    // The nav is also on /changelog, /roadmap and the legal pages, so the link
    // carries the locale path: a bare `#access` would resolve against that page.
    renderWithProviders(<PublicNav isSignedIn={false} locale="de" />);
    expect(screen.getByRole("link", { name: /zugang anfragen/i })).toHaveAttribute(
      "href",
      "/de#access",
    );
    expect(screen.queryByRole("link", { name: /konto erstellen/i })).not.toBeInTheDocument();
  });

  it("offers the app instead of signup to a signed-in visitor", () => {
    renderWithProviders(<PublicNav isSignedIn locale="de" />);
    const toApp = screen.getByRole("link", { name: /zur app/i });
    expect(toApp).toHaveAttribute("href", "/de/dashboard");
    expect(screen.queryByRole("link", { name: /anmelden/i })).not.toBeInTheDocument();
  });

  it("exposes a navigation landmark", () => {
    renderWithProviders(<PublicNav isSignedIn={false} locale="de" />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });
});
