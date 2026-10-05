import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

import { renderWithProviders } from "@/test/render";

import deMessages from "../../../messages/de.json";
import enMessages from "../../../messages/en.json";

import { AccessRequestForm } from "./AccessRequestForm";

const de = deMessages.access;
const en = enMessages.access;

function renderEn() {
  return render(
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <AccessRequestForm locale="en" />
    </NextIntlClientProvider>,
  );
}

function fillValid() {
  fireEvent.change(screen.getByLabelText(de.fields.name), { target: { value: "Ada Lovelace" } });
  fireEvent.change(screen.getByLabelText(de.fields.email), {
    target: { value: "ada@example.com" },
  });
  fireEvent.change(screen.getByLabelText(de.fields.institution), {
    target: { value: "Royal Society" },
  });
  fireEvent.change(screen.getByLabelText(de.fields.researchArea), {
    target: { value: "Computing history" },
  });
  fireEvent.change(screen.getByLabelText(de.fields.toolGap), {
    target: { value: "Which letters survive?" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: deMessages.marketing.cta.action }));
}

function okResponse(): Response {
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse()));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AccessRequestForm — structure", () => {
  it("is the landing page's #access band, with a heading and the closed-alpha copy", () => {
    const { container } = renderWithProviders(<AccessRequestForm locale="de" />);
    expect(container.querySelector("section#access")).not.toBeNull();
    expect(
      screen.getByRole("heading", { name: deMessages.marketing.cta.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(deMessages.marketing.cta.body)).toBeInTheDocument();
  });

  it("renders every field with a label; institution, research area and tool gap are optional", () => {
    renderWithProviders(<AccessRequestForm locale="de" />);
    expect(screen.getByLabelText(de.fields.name)).toBeRequired();
    expect(screen.getByLabelText(de.fields.email)).toHaveAttribute("type", "email");
    expect(screen.getByLabelText(de.fields.institution)).not.toBeRequired();
    expect(screen.getByLabelText(de.fields.researchArea)).not.toBeRequired();
    const toolGap = screen.getByLabelText(de.fields.toolGap);
    expect(toolGap.tagName).toBe("TEXTAREA");
    expect(toolGap).not.toBeRequired();
  });

  it("says that an undecided request is deleted after 6 hours", () => {
    renderWithProviders(<AccessRequestForm locale="de" />);
    expect(screen.getByText(de.retention)).toBeInTheDocument();
  });

  it("has no automatically detectable accessibility violations", async () => {
    const { container } = renderWithProviders(<AccessRequestForm locale="de" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("AccessRequestForm — honeypot", () => {
  it("is hidden from assistive technology, out of the tab order, and not autofilled", () => {
    const { container } = renderWithProviders(<AccessRequestForm locale="de" />);
    const trap = container.querySelector<HTMLInputElement>('input[name="company"]');

    expect(trap).not.toBeNull();
    expect(trap!.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(trap).toHaveAttribute("tabindex", "-1");
    expect(trap).toHaveAttribute("autocomplete", "off");
  });

  it("is not reachable through any accessible role or label", () => {
    renderWithProviders(<AccessRequestForm locale="de" />);
    const names = screen.getAllByRole("textbox").map((el) => el.getAttribute("name"));
    expect(names).not.toContain("company");
  });

  it("is submitted empty by a person", async () => {
    renderWithProviders(<AccessRequestForm locale="de" />);
    fillValid();
    submit();

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const body = JSON.parse(vi.mocked(fetch).mock.calls[0]![1]!.body as string);
    expect(body.company).toBe("");
  });
});

describe("AccessRequestForm — consent", () => {
  it("links the privacy policy in the page's locale", () => {
    renderWithProviders(<AccessRequestForm locale="de" />);
    expect(screen.getByRole("link", { name: /datenschutzerklärung/i })).toHaveAttribute(
      "href",
      "/de/datenschutz",
    );

    const { container } = renderEn();
    expect(container.querySelector('a[href="/en/datenschutz"]')).not.toBeNull();
  });

  it("is an unchecked checkbox named by the consent sentence", () => {
    renderWithProviders(<AccessRequestForm locale="de" />);
    const box = screen.getByRole("checkbox", { name: /datenschutzerklärung/i });
    expect(box).not.toBeChecked();
  });
});

describe("AccessRequestForm — validation", () => {
  it("shows translated messages, never message keys, and sends nothing", async () => {
    const { container } = renderWithProviders(<AccessRequestForm locale="de" />);
    submit();

    expect(await screen.findByText(de.errors.nameRequired)).toBeInTheDocument();
    expect(screen.getByText(de.errors.emailInvalid)).toBeInTheDocument();
    expect(screen.getByText(de.errors.consentRequired)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/access\.errors|errors\./);
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByLabelText(de.fields.name)).toHaveAttribute("aria-invalid", "true");
  });

  it("translates in English too", async () => {
    renderEn();
    fireEvent.click(screen.getByRole("button", { name: enMessages.marketing.cta.action }));

    expect(await screen.findByText(en.errors.nameRequired)).toBeInTheDocument();
    expect(screen.getByText(en.errors.consentRequired)).toBeInTheDocument();
  });

  it("rejects over-long free text with a translated message", async () => {
    renderWithProviders(<AccessRequestForm locale="de" />);
    fillValid();
    fireEvent.change(screen.getByLabelText(de.fields.toolGap), {
      target: { value: "x".repeat(2001) },
    });
    submit();

    expect(await screen.findByText(de.errors.toolGapTooLong)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("AccessRequestForm — submission", () => {
  it("posts the fields, the locale, the consent and the mount time as JSON", async () => {
    const before = Date.now();
    renderWithProviders(<AccessRequestForm locale="de" />);
    fillValid();
    submit();

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const [url, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(url).toBe("/api/access-request");
    expect(init!.method).toBe("POST");
    expect(init!.headers).toMatchObject({ "Content-Type": "application/json" });
    const body = JSON.parse(init!.body as string);
    expect(body).toMatchObject({
      name: "Ada Lovelace",
      email: "ada@example.com",
      institution: "Royal Society",
      research_area: "Computing history",
      tool_gap: "Which letters survive?",
      locale: "de",
      consent: true,
      company: "",
    });
    expect(body.rendered_at).toBeGreaterThanOrEqual(before);
    expect(body.rendered_at).toBeLessThanOrEqual(Date.now());
  });

  it("sends the page's locale, not the browser's", async () => {
    renderEn();
    fireEvent.change(screen.getByLabelText(en.fields.name), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText(en.fields.email), {
      target: { value: "ada@example.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: enMessages.marketing.cta.action }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(JSON.parse(vi.mocked(fetch).mock.calls[0]![1]!.body as string).locale).toBe("en");
  });

  it("disables submit while submitting, so a double click sends one request", async () => {
    let resolve!: (res: Response) => void;
    vi.mocked(fetch).mockReturnValue(new Promise<Response>((r) => (resolve = r)));

    renderWithProviders(<AccessRequestForm locale="de" />);
    fillValid();
    submit();

    const button = await screen.findByRole("button", { name: de.submitting });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    fireEvent.click(button);
    expect(fetch).toHaveBeenCalledTimes(1);

    await act(async () => resolve(okResponse()));
    await screen.findByText(de.success);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("replaces the form with a success message that promises no reply", async () => {
    renderWithProviders(<AccessRequestForm locale="de" />);
    fillValid();
    submit();

    const message = await screen.findByText(de.success);
    expect(message.closest('[role="status"]')).not.toBeNull();
    expect(screen.queryByRole("button", { name: deMessages.marketing.cta.action })).toBeNull();
    expect(screen.queryByLabelText(de.fields.name)).toBeNull();
    // It says what happens if nobody invites them — deletion after 6 hours —
    // and promises neither an answer nor a time.
    expect(de.success).toMatch(/Wenn wir Sie einladen können/);
    expect(de.success).toMatch(/6 Stunden gelöscht/);
    expect(de.success).not.toMatch(/antworten|melden uns|garantier|zeitnah|bald|innerhalb/i);
    expect(en.success).toMatch(/If we can invite you/);
    expect(en.success).not.toMatch(/we will (reply|respond|get back)|guarantee|promptly|soon/i);
  });

  it("shows the same success whatever the server did with the address (no enumeration)", async () => {
    // The route returns one body for every accepted case; the form has nothing
    // to branch on, so it must not read the body.
    vi.mocked(fetch).mockResolvedValue(new Response("{}", { status: 200 }));
    renderWithProviders(<AccessRequestForm locale="de" />);
    fillValid();
    submit();
    expect(await screen.findByText(de.success)).toBeInTheDocument();
  });

  // #163: an existing account holder is told by email; the screen is the same for everyone.
  it("de: shows 'Haben Sie bereits ein Konto?' with a primary Anmelden and a tertiary Passwort vergessen", async () => {
    renderWithProviders(<AccessRequestForm locale="de" />);
    fillValid();
    submit();
    await screen.findByText(de.success);

    expect(de.existingAccount.prompt).toBe("Haben Sie bereits ein Konto?");
    expect(screen.getByText(de.existingAccount.prompt)).toBeInTheDocument();

    const login = screen.getByRole("link", { name: de.existingAccount.login });
    expect(login).toHaveAttribute("href", "/de/auth/login");
    // Primary = the default Button variant: filled with the primary colour.
    expect(login).toHaveClass("bg-primary", "text-primary-foreground");

    const forgot = screen.getByRole("link", { name: de.existingAccount.forgotPassword });
    expect(forgot).toHaveAttribute("href", "/de/auth/forgot-password");
    // Tertiary = the `link` variant: text only, no fill.
    expect(forgot).toHaveClass("text-primary", "underline-offset-4");
    expect(forgot).not.toHaveClass("bg-primary");
  });

  it("moves focus to the result, and the announced region includes the account hint (#164)", async () => {
    renderWithProviders(<AccessRequestForm locale="de" />);
    fillValid();
    submit();
    const message = await screen.findByText(de.success);

    const region = message.closest('[role="status"]');
    expect(region).not.toBeNull();
    expect(region).toHaveFocus();
    expect(region).toHaveTextContent(de.existingAccount.prompt);
    expect(region).toContainElement(screen.getByRole("link", { name: de.existingAccount.login }));
  });

  it("en: shows 'Already have an account?' with Log in and Forgot password under /en/", async () => {
    renderEn();
    fireEvent.change(screen.getByLabelText(en.fields.name), { target: { value: "Ada Lovelace" } });
    fireEvent.change(screen.getByLabelText(en.fields.email), {
      target: { value: "ada@example.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: enMessages.marketing.cta.action }));
    await screen.findByText(en.success);

    expect(screen.getByText("Already have an account?")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/en/auth/login");
    expect(screen.getByRole("link", { name: "Forgot password" })).toHaveAttribute(
      "href",
      "/en/auth/forgot-password",
    );
  });

  it("shows the hint for every accepted submission, whatever the server did (no enumeration)", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("{}", { status: 200 }));
    renderWithProviders(<AccessRequestForm locale="de" />);
    fillValid();
    submit();
    await screen.findByText(de.success);
    expect(screen.getByRole("link", { name: de.existingAccount.login })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: de.existingAccount.forgotPassword }),
    ).toBeInTheDocument();
  });

  it("does not show the hint before a submission or after a failed one", async () => {
    renderWithProviders(<AccessRequestForm locale="de" />);
    expect(screen.queryByText(de.existingAccount.prompt)).toBeNull();

    vi.mocked(fetch).mockResolvedValue(new Response("{}", { status: 500 }));
    fillValid();
    submit();
    await screen.findByRole("alert");
    expect(screen.queryByText(de.existingAccount.prompt)).toBeNull();
  });

  it("the German copy addresses the reader as Sie", () => {
    expect(de.existingAccount.prompt).toMatch(/\bSie\b/);
    expect(JSON.stringify(de.existingAccount)).not.toMatch(/\b(du|dein|dir)\b/i);
  });
});

describe("AccessRequestForm — failures keep the form and re-enable submit", () => {
  async function fail(response: Response | Error, expected: string) {
    if (response instanceof Error) vi.mocked(fetch).mockRejectedValue(response);
    else vi.mocked(fetch).mockResolvedValue(response);

    renderWithProviders(<AccessRequestForm locale="de" />);
    fillValid();
    submit();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(expected);
    expect(screen.getByRole("button", { name: deMessages.marketing.cta.action })).toBeEnabled();
    expect(screen.getByLabelText(de.fields.name)).toHaveValue("Ada Lovelace");
  }

  it("429 reports the wait from Retry-After", async () => {
    await fail(
      new Response("{}", { status: 429, headers: { "Retry-After": "1800" } }),
      de.errors.rateLimited.replace("{minutes}", "30"),
    );
  });

  it("503 says the service is unavailable", async () => {
    await fail(new Response("{}", { status: 503 }), de.errors.serviceUnavailable);
  });

  it("400 asks the person to check their details", async () => {
    await fail(new Response("{}", { status: 400 }), de.errors.invalid);
  });

  it("500 shows a generic error", async () => {
    await fail(new Response("{}", { status: 500 }), de.errors.serverError);
  });

  it("a network failure says so", async () => {
    await fail(new TypeError("Failed to fetch"), de.errors.networkError);
  });
});
