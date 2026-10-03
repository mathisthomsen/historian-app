import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

const resolveInvite = vi.hoisted(() => vi.fn());

vi.mock("@/lib/invite", () => ({ resolveInvite }));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => (key === "title" ? "Konto erstellen" : key),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import RegisterPage from "./page";

async function renderPage(invite?: string | string[]) {
  const element = await RegisterPage({
    searchParams: Promise.resolve(invite === undefined ? {} : { invite }),
  });
  return renderWithProviders(element);
}

describe("register page (invite preview, §4.2)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("valid: renders the form with the invited address read-only", async () => {
    resolveInvite.mockResolvedValue({
      kind: "valid",
      id: "inv_1",
      email: "invited@example.org",
      token: "tok",
    });

    await renderPage("tok");

    const email = screen.getByLabelText("E-Mail") as HTMLInputElement;
    expect(email.value).toBe("invited@example.org");
    expect(email.readOnly).toBe(true);
    expect(screen.getByRole("button", { name: "Konto erstellen" })).toBeInTheDocument();
  });

  it.each([
    ["missing", "Die Registrierung ist nur mit Einladung möglich."],
    ["invalid", "Dieser Einladungslink ist ungültig."],
    ["expired", "Dieser Einladungslink ist abgelaufen."],
    ["used", "Dieser Einladungslink wurde bereits verwendet."],
  ])("%s: renders the state card and no form", async (kind, sentence) => {
    resolveInvite.mockResolvedValue({ kind });

    const { container } = await renderPage("tok");

    expect(screen.getByText(sentence)).toBeInTheDocument();
    expect(container.querySelector("form, input")).toBeNull();
  });

  it("passes the presented token to resolveInvite", async () => {
    resolveInvite.mockResolvedValue({ kind: "invalid" });

    await renderPage("the-token");

    expect(resolveInvite).toHaveBeenCalledWith("the-token");
  });

  it.each([
    ["no parameter", undefined],
    ["a repeated parameter", ["a", "b"]],
  ])("%s is the missing state, never a lookup of an array", async (_label, invite) => {
    resolveInvite.mockResolvedValue({ kind: "missing" });

    await renderPage(invite);

    expect(resolveInvite).toHaveBeenCalledWith(null);
    expect(
      screen.getByText("Die Registrierung ist nur mit Einladung möglich."),
    ).toBeInTheDocument();
  });
});
