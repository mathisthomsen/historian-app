import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import { LocaleSwitcher } from "./locale-switcher";

vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useLocale: () => "de",
  };
});

vi.mock("@/i18n/routing", () => ({
  routing: { locales: ["de", "en"], defaultLocale: "de" },
}));

const mockReplace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/de",
}));

describe("LocaleSwitcher", () => {
  it("renders DE and EN buttons", () => {
    renderWithProviders(<LocaleSwitcher />);
    expect(screen.getByRole("button", { name: /DE/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /EN/i })).toBeInTheDocument();
  });

  it("marks current locale as active", () => {
    renderWithProviders(<LocaleSwitcher />);
    const deButton = screen.getByRole("button", { name: /DE/i });
    expect(deButton).toHaveAttribute("aria-pressed", "true");
  });

  it("marks non-active locale button as not pressed", () => {
    renderWithProviders(<LocaleSwitcher />);
    const enButton = screen.getByRole("button", { name: /EN/i });
    expect(enButton).toHaveAttribute("aria-pressed", "false");
  });

  it("calls router.replace when switching locale", () => {
    renderWithProviders(<LocaleSwitcher />);
    const enButton = screen.getByRole("button", { name: /EN/i });
    fireEvent.click(enButton);
    expect(mockReplace).toHaveBeenCalled();
  });
});
