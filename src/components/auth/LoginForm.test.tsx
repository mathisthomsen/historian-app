import { fireEvent, screen, waitFor } from "@testing-library/react";
import { signIn } from "next-auth/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import { LoginForm } from "./LoginForm";

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

// We control useSearchParams via the mock factory
const mockSearchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => mockSearchParams,
}));

vi.mock("next-intl", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  };
});

describe("LoginForm", () => {
  it("renders email and password fields", () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByLabelText(/fields\.email/i)).toBeDefined();
    expect(screen.getByLabelText(/fields\.password/i)).toBeDefined();
  });

  it("renders submit button", () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByRole("button", { name: /login\.submit/i })).toBeDefined();
  });

  it("shows error message when signIn returns an error", async () => {
    vi.mocked(signIn).mockResolvedValueOnce({
      error: "CredentialsSignin",
      code: "CredentialsSignin",
      ok: false,
      status: 401,
    } as Awaited<ReturnType<typeof signIn>>);

    renderWithProviders(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/fields\.email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/fields\.password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login\.submit/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
    });
  });

  it("shows resetSuccess banner when ?reset=1 in URL", () => {
    // Set reset=1 on the shared mockSearchParams instance
    mockSearchParams.set("reset", "1");

    renderWithProviders(<LoginForm />);

    expect(screen.getByText("login.resetSuccess")).toBeDefined();

    // Clean up for other tests
    mockSearchParams.delete("reset");
  });
});
