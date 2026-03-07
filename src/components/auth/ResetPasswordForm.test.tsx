import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import { ResetPasswordForm } from "./ResetPasswordForm";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

describe("ResetPasswordForm", () => {
  it("renders password and confirm-password fields", () => {
    renderWithProviders(<ResetPasswordForm token="test-token" />);
    expect(screen.getByLabelText(/reset\.newPassword/i)).toBeDefined();
    expect(screen.getByLabelText(/reset\.confirmPassword/i)).toBeDefined();
  });

  it("calls router.push to login page on successful 200 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: true, status: 200 } as Response),
    );

    renderWithProviders(<ResetPasswordForm token="valid-token" />);

    fireEvent.change(screen.getByLabelText(/reset\.newPassword/i), {
      target: { value: "Demo1234!" },
    });
    fireEvent.change(screen.getByLabelText(/reset\.confirmPassword/i), {
      target: { value: "Demo1234!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /reset\.submit/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/auth/login?reset=1");
    });

    vi.unstubAllGlobals();
  });

  it("shows error on 400 tokenExpired response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: "auth.errors.tokenExpired" }),
      } as Response),
    );

    renderWithProviders(<ResetPasswordForm token="expired-token" />);

    fireEvent.change(screen.getByLabelText(/reset\.newPassword/i), {
      target: { value: "Demo1234!" },
    });
    fireEvent.change(screen.getByLabelText(/reset\.confirmPassword/i), {
      target: { value: "Demo1234!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /reset\.submit/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
    });

    vi.unstubAllGlobals();
  });
});
