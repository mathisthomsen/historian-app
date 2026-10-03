import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "@/test/render";

import { InviteStateCard } from "./InviteStateCard";

// Real German messages (renderWithProviders): the copy is the contract, and a
// mocked `t` would hide a key that does not exist.
describe("InviteStateCard", () => {
  it("missing: says registration is by invitation and links to the access form", () => {
    renderWithProviders(<InviteStateCard kind="missing" />);

    expect(
      screen.getByText("Die Registrierung ist nur mit Einladung möglich."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Zugang anfragen" })).toHaveAttribute(
      "href",
      "/de#access",
    );
  });

  it("invalid: says the link is not valid and links to the access form", () => {
    renderWithProviders(<InviteStateCard kind="invalid" />);

    expect(screen.getByText("Dieser Einladungslink ist ungültig.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Zugang anfragen" })).toHaveAttribute(
      "href",
      "/de#access",
    );
  });

  it("expired: says the link expired and offers to request access again", () => {
    renderWithProviders(<InviteStateCard kind="expired" />);

    expect(screen.getByText("Dieser Einladungslink ist abgelaufen.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Zugang erneut anfragen" })).toHaveAttribute(
      "href",
      "/de#access",
    );
  });

  it("used: says the link was used and links to sign-in, not to the access form", () => {
    renderWithProviders(<InviteStateCard kind="used" />);

    expect(screen.getByText("Dieser Einladungslink wurde bereits verwendet.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Zur Anmeldung" })).toHaveAttribute(
      "href",
      "/de/auth/login",
    );
    expect(screen.queryByRole("link", { name: /Zugang/ })).not.toBeInTheDocument();
  });

  it("renders no form and no input in any state", () => {
    for (const kind of ["missing", "invalid", "expired", "used"] as const) {
      const { container, unmount } = renderWithProviders(<InviteStateCard kind={kind} />);
      expect(container.querySelector("form, input")).toBeNull();
      unmount();
    }
  });
});
