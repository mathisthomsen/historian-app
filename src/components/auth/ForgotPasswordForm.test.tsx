import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import { ForgotPasswordForm } from "./ForgotPasswordForm";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

describe("ForgotPasswordForm", () => {
  it("renders email field and submit button", () => {
    renderWithProviders(<ForgotPasswordForm />);
    expect(screen.getByLabelText(/fields\.email/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /forgot\.submit/i })).toBeDefined();
  });

  it("shows success state after fetch resolves", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: true, status: 200 } as Response),
    );

    renderWithProviders(<ForgotPasswordForm />);

    fireEvent.change(screen.getByLabelText(/fields\.email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /forgot\.submit/i }));

    await waitFor(() => {
      expect(screen.getByText("forgot.emailSentMessage")).toBeDefined();
    });

    vi.unstubAllGlobals();
  });

  it("shows success state even if fetch throws (no enumeration)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("Network error")),
    );

    renderWithProviders(<ForgotPasswordForm />);

    fireEvent.change(screen.getByLabelText(/fields\.email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /forgot\.submit/i }));

    await waitFor(() => {
      expect(screen.getByText("forgot.emailSentMessage")).toBeDefined();
    });

    vi.unstubAllGlobals();
  });
});
