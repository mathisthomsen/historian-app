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
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: true, status: 200 } as Response));

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

  // Rewritten for issue #48. This used to assert the opposite — that a thrown
  // fetch still rendered "you will receive a link". Enumeration is closed
  // server-side (the route returns an identical 200 either way), so suppressing
  // client failures protected nothing and told a user a mail was on its way when
  // none had been requested.
  it("reports a network failure instead of claiming a mail was sent", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new Error("Network error")));

    renderWithProviders(<ForgotPasswordForm />);

    fireEvent.change(screen.getByLabelText(/fields\.email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /forgot\.submit/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
    });
    expect(screen.queryByText("forgot.emailSentMessage")).toBeNull();

    vi.unstubAllGlobals();
  });

  it("reports being throttled instead of claiming a mail was sent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: { get: () => "3600" },
        json: async () => ({ error: { code: "RATE_LIMITED" } }),
      } as unknown as Response),
    );

    renderWithProviders(<ForgotPasswordForm />);

    fireEvent.change(screen.getByLabelText(/fields\.email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /forgot\.submit/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
    });
    expect(screen.queryByText("forgot.emailSentMessage")).toBeNull();

    vi.unstubAllGlobals();
  });
});
