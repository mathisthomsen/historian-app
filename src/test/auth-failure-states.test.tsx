import userEvent from "@testing-library/user-event";
import { signIn } from "next-auth/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { VerifyEmailCard } from "@/components/auth/VerifyEmailCard";
import { SIGN_IN_CODES } from "@/lib/auth-errors";
import { renderWithProviders, screen, waitFor } from "@/test/render";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: "de" }),
}));

vi.mock("next-auth/react", () => ({ signIn: vi.fn() }));

const signInMock = vi.mocked(signIn);

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function response(init: {
  ok?: boolean;
  status: number;
  retryAfter?: string;
  body?: unknown;
}): Response {
  return {
    ok: init.ok ?? false,
    status: init.status,
    headers: { get: (h: string) => (h === "Retry-After" ? (init.retryAfter ?? null) : null) },
    json: async () => init.body ?? {},
  } as unknown as Response;
}

async function alertText(): Promise<string> {
  const alert = await waitFor(() => screen.getByRole("alert"));
  return alert.textContent ?? "";
}

/**
 * Guards issue #48: distinct auth failures collapsed into one message, and two
 * were reported as success.
 */
describe("login failure states are distinguishable", () => {
  async function submitLogin() {
    renderWithProviders(<LoginForm />);
    await userEvent.type(screen.getByLabelText("E-Mail"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Passwort"), "whatever");
    await userEvent.click(screen.getByRole("button", { name: "Anmelden" }));
  }

  it("distinguishes rate-limit exhaustion from bad credentials", async () => {
    signInMock.mockResolvedValue({
      error: "CredentialsSignin",
      code: SIGN_IN_CODES.rateLimited,
    } as never);

    await submitLogin();

    const text = await alertText();
    expect(text).toContain("Zu viele Anmeldeversuche");
    expect(text).toContain("15");
    expect(text).not.toContain("E-Mail oder Passwort ungültig");
  });

  it("names the lockout and its duration", async () => {
    signInMock.mockResolvedValue({
      error: "CredentialsSignin",
      code: SIGN_IN_CODES.accountLocked,
    } as never);

    await submitLogin();

    const text = await alertText();
    expect(text).toContain("30");
    expect(text).not.toContain("E-Mail oder Passwort ungültig");
  });

  it("reports an unverified email rather than wrong credentials", async () => {
    // Previously dead code: a plain thrown Error surfaced as "Configuration".
    signInMock.mockResolvedValue({
      error: "CredentialsSignin",
      code: SIGN_IN_CODES.emailNotVerified,
    } as never);

    await submitLogin();

    expect(await alertText()).toContain("Bitte bestätige zuerst deine E-Mail-Adresse.");
  });

  it("still says invalid credentials for a wrong password", async () => {
    signInMock.mockResolvedValue({
      error: "CredentialsSignin",
      code: SIGN_IN_CODES.invalidCredentials,
    } as never);

    await submitLogin();

    expect(await alertText()).toContain("E-Mail oder Passwort ungültig.");
  });

  it("reports an unclassified failure as a server fault, not bad input", async () => {
    signInMock.mockResolvedValue({ error: "Configuration", code: undefined } as never);

    await submitLogin();

    const text = await alertText();
    expect(text).not.toContain("E-Mail oder Passwort ungültig");
  });
});

describe("register reports the real wait and a degraded service", () => {
  async function submitRegister() {
    renderWithProviders(<RegisterForm />);
    await userEvent.type(screen.getByLabelText("Name"), "Ada");
    await userEvent.type(screen.getByLabelText("E-Mail"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Passwort", { exact: true }), "ValidP@ss1");
    await userEvent.type(screen.getByLabelText("Passwort bestätigen"), "ValidP@ss1");
    await userEvent.click(screen.getByRole("button", { name: "Konto erstellen" }));
  }

  it("uses Retry-After rather than the hardcoded 15 minutes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(response({ status: 429, retryAfter: "3600" })),
    );

    await submitRegister();

    const text = await alertText();
    expect(text).toContain("60");
    expect(text).not.toContain("15");
  });

  it("falls back to the route's real 60-minute window, not 15", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ status: 429 })));

    await submitRegister();

    expect(await alertText()).toContain("60");
  });

  it("reports a degraded service distinctly from a generic error", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          response({ status: 503, body: { error: { code: "SERVICE_UNAVAILABLE" } } }),
        ),
    );

    await submitRegister();

    expect(await alertText()).toContain("Der Dienst ist vorübergehend nicht verfügbar");
  });
});

describe("reset password distinguishes a malformed token from a server fault", () => {
  async function submitReset() {
    renderWithProviders(<ResetPasswordForm token="truncated" />);
    await userEvent.type(screen.getByLabelText("Neues Passwort"), "ValidP@ss1");
    await userEvent.type(screen.getByLabelText("Passwort bestätigen"), "ValidP@ss1");
    await userEvent.click(screen.getByRole("button", { name: "Passwort speichern" }));
  }

  it("explains a line-wrapped link instead of blaming the server", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          response({ status: 400, body: { error: { code: "VALIDATION_FAILED" } } }),
        ),
    );

    await submitReset();

    const text = await alertText();
    expect(text).toContain("unvollständig");
    expect(text).not.toContain("Ein Fehler ist aufgetreten");
  });

  it("reports being throttled with the real wait", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ status: 429, retryAfter: "900" })));

    await submitReset();

    const text = await alertText();
    expect(text).toContain("15");
    expect(text).not.toContain("Ein Fehler ist aufgetreten");
  });
});

describe("verify email separates a rejected link from a failed request", () => {
  it("offers a retry on 5xx rather than declaring the link broken", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ status: 500 })));

    renderWithProviders(<VerifyEmailCard token="abc" />);

    await waitFor(() => expect(screen.getByText("Bestätigung fehlgeschlagen")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Erneut versuchen" })).toBeInTheDocument();
    expect(screen.queryByText("Link ungültig")).not.toBeInTheDocument();
  });

  it("offers a retry when offline", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    renderWithProviders(<VerifyEmailCard token="abc" />);

    await waitFor(() => expect(screen.getByText("Bestätigung fehlgeschlagen")).toBeInTheDocument());
    expect(
      screen.getByText(
        "Keine Verbindung zum Server. Bitte Internetverbindung prüfen und erneut versuchen.",
      ),
    ).toBeInTheDocument();
  });

  it("does declare the link invalid when the server rejects the token", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(response({ status: 400, body: { error: { code: "TOKEN_EXPIRED" } } })),
    );

    renderWithProviders(<VerifyEmailCard token="abc" />);

    await waitFor(() => expect(screen.getByText("Link ungültig")).toBeInTheDocument());
    expect(
      screen.getByText("Der Link ist abgelaufen. Bitte fordere einen neuen an."),
    ).toBeInTheDocument();
  });

  it("retrying re-issues the request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    renderWithProviders(<VerifyEmailCard token="abc" />);

    await waitFor(() => expect(screen.getByText("Bestätigung fehlgeschlagen")).toBeInTheDocument());
    const callsBefore = fetchMock.mock.calls.length;
    await userEvent.click(screen.getByRole("button", { name: "Erneut versuchen" }));

    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(callsBefore));
  });
});
