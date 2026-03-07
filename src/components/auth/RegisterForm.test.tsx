import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import { RegisterForm } from "./RegisterForm";

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

describe("RegisterForm", () => {
  it("renders name, email, password, and confirm-password fields", () => {
    renderWithProviders(<RegisterForm />);
    expect(screen.getByLabelText(/fields\.name/i)).toBeDefined();
    expect(screen.getByLabelText(/fields\.email/i)).toBeDefined();
    expect(screen.getByLabelText(/fields\.password/i)).toBeDefined();
    expect(screen.getByLabelText(/fields\.confirmPassword/i)).toBeDefined();
  });

  it("shows success card when fetch returns 201", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: true, status: 201 } as Response),
    );

    renderWithProviders(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/fields\.name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/fields\.email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/fields\.password/i), {
      target: { value: "Demo1234!" },
    });
    fireEvent.change(screen.getByLabelText(/fields\.confirmPassword/i), {
      target: { value: "Demo1234!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /register\.submit/i }));

    await waitFor(() => {
      expect(screen.getByText("register.verificationSent")).toBeDefined();
    });

    vi.unstubAllGlobals();
  });

  it("shows email taken error when fetch returns 409", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({ ok: false, status: 409 } as Response),
    );

    renderWithProviders(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/fields\.name/i), {
      target: { value: "Test User" },
    });
    fireEvent.change(screen.getByLabelText(/fields\.email/i), {
      target: { value: "taken@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/fields\.password/i), {
      target: { value: "Demo1234!" },
    });
    fireEvent.change(screen.getByLabelText(/fields\.confirmPassword/i), {
      target: { value: "Demo1234!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /register\.submit/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
    });
    expect(screen.getByText("errors.emailTaken")).toBeDefined();

    vi.unstubAllGlobals();
  });

  it("renders PasswordStrengthIndicator when password has content", async () => {
    renderWithProviders(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/fields\.password/i), {
      target: { value: "abc" },
    });

    await waitFor(() => {
      // PasswordStrengthIndicator renders a group with aria-label
      expect(screen.getByRole("group")).toBeDefined();
    });
  });
});
