import userEvent from "@testing-library/user-event";
import { signIn } from "next-auth/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { ResendVerification } from "@/components/auth/ResendVerification";
import { VerifyEmailCard } from "@/components/auth/VerifyEmailCard";
import { SIGN_IN_CODES } from "@/lib/auth-errors";
import { renderWithProviders, screen, waitFor } from "@/test/render";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: "de" }),
}));

vi.mock("next-auth/react", () => ({ signIn: vi.fn() }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function response(init: { ok?: boolean; status: number; body?: unknown }): Response {
  return {
    ok: init.ok ?? (init.status >= 200 && init.status < 300),
    status: init.status,
    headers: { get: () => null },
    json: async () => init.body ?? {},
  } as unknown as Response;
}

/**
 * Guards issue #43: there was no resend-verification capability anywhere, and the
 * only recovery action pointed at /auth/forgot-password — a password reset.
 */
describe("resend verification", () => {
  it("posts to the resend endpoint, not the password-reset one", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<ResendVerification email="ada@example.com" />);
    await userEvent.click(screen.getByRole("button", { name: "Neuen Bestätigungslink senden" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/auth/resend-verification");
    expect(fetchMock.mock.calls[0]?.[0]).not.toContain("forgot-password");
    expect(JSON.parse(String((fetchMock.mock.calls[0]?.[1] as RequestInit)?.body))).toEqual({
      email: "ada@example.com",
    });
  });

  it("confirms neutrally on success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ status: 200 })));

    renderWithProviders(<ResendVerification email="ada@example.com" />);
    await userEvent.click(screen.getByRole("button", { name: "Neuen Bestätigungslink senden" }));

    await waitFor(() =>
      expect(
        screen.getByText(
          "Wenn für diese Adresse eine Bestätigung aussteht, ist ein neuer Link unterwegs.",
        ),
      ).toBeInTheDocument(),
    );
  });

  it("reports throttling instead of claiming a link was sent", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ status: 429 })));

    renderWithProviders(<ResendVerification email="ada@example.com" />);
    await userEvent.click(screen.getByRole("button", { name: "Neuen Bestätigungslink senden" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.queryByText(/ein neuer Link unterwegs/)).not.toBeInTheDocument();
  });
});

describe("entry points into the resend path", () => {
  it("an expired verification link offers a resend, not a password reset", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(response({ status: 400, body: { error: { code: "TOKEN_EXPIRED" } } })),
    );

    renderWithProviders(<VerifyEmailCard token="expired" />);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Neuen Bestätigungslink senden" }),
      ).toBeInTheDocument(),
    );
    // The old "Neuen Link anfordern" link pointed at /auth/forgot-password.
    const resetLinks = screen
      .queryAllByRole("link")
      .filter((a) => a.getAttribute("href")?.includes("forgot-password"));
    expect(resetLinks).toHaveLength(0);
  });

  it("an already-used link says already confirmed, not expired", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          response({ status: 400, body: { error: { code: "TOKEN_ALREADY_USED" } } }),
        ),
    );

    renderWithProviders(<VerifyEmailCard token="used" />);

    await waitFor(() => expect(screen.getByText("Bereits bestätigt")).toBeInTheDocument());
    expect(
      screen.queryByText("Der Link ist abgelaufen. Bitte fordere einen neuen an."),
    ).not.toBeInTheDocument();
  });

  it("an unverified sign-in offers a resend for that address", async () => {
    vi.mocked(signIn).mockResolvedValue({
      error: "CredentialsSignin",
      code: SIGN_IN_CODES.emailNotVerified,
    } as never);
    const { LoginForm } = await import("@/components/auth/LoginForm");

    renderWithProviders(<LoginForm />);
    await userEvent.type(screen.getByLabelText("E-Mail"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Passwort"), "whatever");
    await userEvent.click(screen.getByRole("button", { name: "Anmelden" }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Neuen Bestätigungslink senden" }),
      ).toBeInTheDocument(),
    );
  });
});

describe("registration tells the truth about the verification mail", () => {
  async function submitRegister(body: unknown) {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ status: 201, body })));

    renderWithProviders(<RegisterForm />);
    await userEvent.type(screen.getByLabelText("Name"), "Ada");
    await userEvent.type(screen.getByLabelText("E-Mail"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Passwort", { exact: true }), "ValidP@ss1");
    await userEvent.type(screen.getByLabelText("Passwort bestätigen"), "ValidP@ss1");
    await userEvent.click(screen.getByRole("button", { name: "Konto erstellen" }));
  }

  it("does not claim a mail was sent when the route says it was not", async () => {
    await submitRegister({ email_sent: false });

    await waitFor(() =>
      expect(
        screen.getByText("Konto erstellt — E-Mail konnte nicht zugestellt werden"),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole("button", { name: "Neuen Bestätigungslink senden" }),
    ).toBeInTheDocument();
  });

  it("confirms, and still offers a resend and a way to sign in, when it was sent", async () => {
    await submitRegister({ email_sent: true });

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Neuen Bestätigungslink senden" }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole("link", { name: /Zur Anmeldung/ })).toBeInTheDocument();
    expect(
      screen.queryByText("Konto erstellt — E-Mail konnte nicht zugestellt werden"),
    ).not.toBeInTheDocument();
  });
});
