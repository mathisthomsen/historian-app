import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { EventForm } from "@/components/research/EventForm";
import { renderWithProviders, screen, waitFor } from "@/test/render";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: "de" }),
}));

vi.mock("next-auth/react", () => ({
  signIn: vi.fn().mockResolvedValue({ error: null }),
}));

/**
 * Guards issue #41: schemas declared at module scope cannot see `t()`, so zod fell
 * back to its English defaults and, where a message was supplied, emitted the raw
 * i18n key. Everything here renders against the real German catalog — the assertion
 * is on the string a German user actually sees.
 */

/** Text that must never reach a user: zod's English defaults and bare i18n keys. */
const LEAKS = [
  /String must contain at least/i,
  /Invalid email/i,
  /^Invalid$/,
  /Number must be/i,
  /auth\.errors\./,
  /^month_requires_year$/,
  /^day_requires_month$/,
];

function expectNoLeakedValidationText() {
  const body = document.body.textContent ?? "";
  for (const leak of LEAKS) {
    expect(body).not.toMatch(leak);
  }
}

describe("form validation messages are translated", () => {
  it("ForgotPasswordForm rejects a malformed email in German", async () => {
    renderWithProviders(<ForgotPasswordForm />);

    await userEvent.type(screen.getByLabelText("E-Mail"), "ada@localhost");
    await userEvent.click(screen.getByRole("button", { name: "Link anfordern" }));

    await waitFor(() =>
      expect(screen.getByText("Bitte eine gültige E-Mail-Adresse eingeben.")).toBeInTheDocument(),
    );
    expectNoLeakedValidationText();
  });

  it("LoginForm renders its validation errors, in German", async () => {
    renderWithProviders(<LoginForm />);

    await userEvent.type(screen.getByLabelText("E-Mail"), "ada@localhost");
    await userEvent.click(screen.getByRole("button", { name: "Anmelden" }));

    await waitFor(() =>
      expect(screen.getByText("Bitte eine gültige E-Mail-Adresse eingeben.")).toBeInTheDocument(),
    );
    expect(screen.getByText("Bitte ein Passwort eingeben.")).toBeInTheDocument();
    expectNoLeakedValidationText();
  });

  it("RegisterForm rejects an empty name and malformed email in German", async () => {
    renderWithProviders(<RegisterForm />);

    await userEvent.type(screen.getByLabelText("E-Mail"), "ada@localhost");
    await userEvent.click(screen.getByRole("button", { name: "Konto erstellen" }));

    await waitFor(() =>
      expect(screen.getByText("Bitte einen Namen eingeben.")).toBeInTheDocument(),
    );
    expect(screen.getByText("Bitte eine gültige E-Mail-Adresse eingeben.")).toBeInTheDocument();
    expectNoLeakedValidationText();
  });

  it("ResetPasswordForm reports a short password and a mismatch in German", async () => {
    renderWithProviders(<ResetPasswordForm token="t" />);

    await userEvent.type(screen.getByLabelText("Neues Passwort"), "short");
    await userEvent.type(screen.getByLabelText("Passwort bestätigen"), "different");
    await userEvent.click(screen.getByRole("button", { name: "Passwort speichern" }));

    await waitFor(() => expect(screen.getByText("Mindestens 8 Zeichen.")).toBeInTheDocument());
    expect(screen.getByText("Passwörter stimmen nicht überein.")).toBeInTheDocument();
    expectNoLeakedValidationText();
  });

  it("EventForm reports a missing title in German", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) }),
    );

    renderWithProviders(
      <EventForm mode="create" projectId="p1" onSuccess={vi.fn()} onCancel={vi.fn()} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Ereignis speichern" }));

    await waitFor(() =>
      expect(screen.getByText("Bitte einen Titel eingeben.")).toBeInTheDocument(),
    );
    expectNoLeakedValidationText();

    vi.unstubAllGlobals();
  });
});
