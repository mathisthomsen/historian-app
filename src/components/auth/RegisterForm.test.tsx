import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

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

const INVITE = { email: "invited@example.com", token: "raw-invite-token" };

afterEach(() => {
  vi.unstubAllGlobals();
});

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText(/fields\.name/i), { target: { value: "Test User" } });
  fireEvent.change(screen.getByLabelText(/fields\.password/i), { target: { value: "Demo1234!" } });
  fireEvent.change(screen.getByLabelText(/fields\.confirmPassword/i), {
    target: { value: "Demo1234!" },
  });
  fireEvent.click(screen.getByRole("button", { name: /register\.submit/i }));
}

describe("RegisterForm", () => {
  it("renders name, email, password, and confirm-password fields", () => {
    renderWithProviders(<RegisterForm invite={INVITE} />);
    expect(screen.getByLabelText(/fields\.name/i)).toBeDefined();
    expect(screen.getByLabelText(/fields\.email/i)).toBeDefined();
    expect(screen.getByLabelText(/fields\.password/i)).toBeDefined();
    expect(screen.getByLabelText(/fields\.confirmPassword/i)).toBeDefined();
  });

  it("shows success card when fetch returns 201", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: true, status: 201 } as Response));

    renderWithProviders(<RegisterForm invite={INVITE} />);
    fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText("register.verificationSent")).toBeDefined();
    });
  });

  it("shows email taken error when fetch returns 409", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: false, status: 409 } as Response));

    renderWithProviders(<RegisterForm invite={INVITE} />);
    fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
    });
    expect(screen.getByText("errors.emailTaken")).toBeDefined();
  });

  it("renders PasswordStrengthIndicator when password has content", async () => {
    renderWithProviders(<RegisterForm invite={INVITE} />);

    fireEvent.change(screen.getByLabelText(/fields\.password/i), {
      target: { value: "abc" },
    });

    await waitFor(() => {
      // PasswordStrengthIndicator renders a group with aria-label
      expect(screen.getByRole("group")).toBeDefined();
    });
  });

  it("prefills the invited address and makes it read-only", () => {
    renderWithProviders(<RegisterForm invite={INVITE} />);

    const email = screen.getByLabelText(/fields\.email/i) as HTMLInputElement;
    expect(email.value).toBe(INVITE.email);
    expect(email.readOnly).toBe(true);
    expect(screen.getByText("invite.invitedAs")).toBeDefined();
  });

  it("sends the invite token and the invited address with the registration", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, status: 201 } as Response);
    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<RegisterForm invite={INVITE} />);

    fillAndSubmit();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/auth/register");
    expect(JSON.parse(init.body as string)).toEqual({
      email: INVITE.email,
      name: "Test User",
      password: "Demo1234!",
      invite: INVITE.token,
    });
  });

  it("disables submit while submitting, so a double click sends one request (#112 item 1)", async () => {
    let settle!: (value: Response) => void;
    const fetchMock = vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => {
        settle = resolve;
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<RegisterForm invite={INVITE} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/fields\.name/i), "Test User");
    await user.type(screen.getByLabelText(/fields\.password/i), "Demo1234!");
    await user.type(screen.getByLabelText(/fields\.confirmPassword/i), "Demo1234!");
    const submit = screen.getByRole("button", { name: /register\.submit/i });

    await user.dblClick(submit);

    await waitFor(() => expect(submit).toBeDisabled());
    expect(fetchMock).toHaveBeenCalledTimes(1);

    settle({ ok: true, status: 201 } as Response);
    await waitFor(() => expect(screen.getByText("register.verificationSent")).toBeDefined());
  });

  it("re-enables submit after a failed attempt", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: false, status: 500 } as Response));
    renderWithProviders(<RegisterForm invite={INVITE} />);

    fillAndSubmit();

    await waitFor(() => expect(screen.getByRole("alert")).toBeDefined());
    expect(screen.getByRole("button", { name: /register\.submit/i })).toBeEnabled();
  });

  it("links to the privacy notice in the page's locale (#112 item 2)", () => {
    renderWithProviders(<RegisterForm invite={INVITE} />);

    expect(screen.getByRole("link", { name: "register.privacy" })).toHaveAttribute(
      "href",
      "/de/datenschutz",
    );
  });

  it.each([
    ["INVITE_REQUIRED", "invite.missing"],
    ["INVITE_INVALID", "invite.invalid"],
    ["INVITE_EXPIRED", "invite.expired"],
    ["INVITE_USED", "invite.used"],
    ["INVITE_EMAIL_MISMATCH", "invite.emailMismatch"],
  ])("maps a 403 %s onto %s", async (code, key) => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: { code } }),
      } as Response),
    );
    renderWithProviders(<RegisterForm invite={INVITE} />);

    fillAndSubmit();

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(key));
  });

  it("does not show a raw code for an unmapped 403", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: { code: "FORBIDDEN" } }),
      } as Response),
    );
    renderWithProviders(<RegisterForm invite={INVITE} />);

    fillAndSubmit();

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("errors.serverError"));
    expect(screen.getByRole("alert")).not.toHaveTextContent("FORBIDDEN");
  });
});
