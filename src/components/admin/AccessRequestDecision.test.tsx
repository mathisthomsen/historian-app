import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import { AccessRequestDecision } from "./AccessRequestDecision";

const mockFetch = vi.fn();

function reply(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

function renderDecision(props: Partial<React.ComponentProps<typeof AccessRequestDecision>> = {}) {
  return renderWithProviders(
    <AccessRequestDecision
      requestId="req-1"
      initialStatus="PENDING"
      accountExists={false}
      {...props}
    />,
  );
}

describe("AccessRequestDecision", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the current status and both decision buttons for a PENDING request", () => {
    renderDecision();
    expect(screen.getByText("Offen")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Einladen" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Ablehnen" })).toBeEnabled();
  });

  it("offers to invite again when the request is already INVITED", () => {
    renderDecision({ initialStatus: "INVITED" });
    expect(screen.getByText("Eingeladen")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Erneut einladen" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Einladen" })).toBeNull();
  });

  it("replaces both buttons with a notice when an account already exists", () => {
    renderDecision({ accountExists: true });
    expect(screen.getByText("Für diese Adresse besteht bereits ein Konto.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Einladen" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Ablehnen" })).toBeNull();
  });

  it("POSTs the decision as same-origin JSON so the browser sends Origin", async () => {
    mockFetch.mockResolvedValue(reply(200, { status: "INVITED", email_sent: true }));
    renderDecision();
    fireEvent.click(screen.getByRole("button", { name: "Einladen" }));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    // A relative URL: same-origin by construction, never an absolute one.
    expect(url).toBe("/api/admin/access-requests/req-1");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("same-origin");
    expect(new Headers(init.headers).get("Content-Type")).toBe("application/json");
    expect(JSON.parse(init.body as string)).toEqual({ decision: "approve" });
  });

  it("URL-encodes the request id", async () => {
    mockFetch.mockResolvedValue(reply(200, { status: "DECLINED" }));
    renderDecision({ requestId: "a/b?c" });
    fireEvent.click(screen.getByRole("button", { name: "Ablehnen" }));
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    expect(mockFetch.mock.calls[0]![0]).toBe("/api/admin/access-requests/a%2Fb%3Fc");
  });

  it("shows the new status inline after an approval, mail sent", async () => {
    mockFetch.mockResolvedValue(reply(200, { status: "INVITED", email_sent: true }));
    renderDecision();
    fireEvent.click(screen.getByRole("button", { name: "Einladen" }));

    expect(
      await screen.findByText("Die Einladung wurde angelegt und per E-Mail versendet."),
    ).toBeInTheDocument();
    expect(screen.getByText("Eingeladen")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Erneut einladen" })).toBeInTheDocument();
  });

  it("says so when the invite was created but the email was not sent, and offers to re-issue", async () => {
    mockFetch.mockResolvedValue(reply(200, { status: "INVITED", email_sent: false }));
    renderDecision();
    fireEvent.click(screen.getByRole("button", { name: "Einladen" }));

    expect(
      await screen.findByText(
        "Die Einladung wurde angelegt, die E-Mail aber nicht versendet. Erneut einladen?",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Eingeladen")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Erneut einladen" })).toBeEnabled();
  });

  it("shows the new status inline after a decline", async () => {
    mockFetch.mockResolvedValue(reply(200, { status: "DECLINED" }));
    renderDecision();
    fireEvent.click(screen.getByRole("button", { name: "Ablehnen" }));

    expect(await screen.findByText("Die Anfrage wurde abgelehnt.")).toBeInTheDocument();
    expect(screen.getByText("Abgelehnt")).toBeInTheDocument();
  });

  it("disables both buttons while submitting, so a double click sends one request", async () => {
    let resolve!: (r: Response) => void;
    mockFetch.mockReturnValue(new Promise<Response>((r) => (resolve = r)));
    renderDecision();
    const approve = screen.getByRole("button", { name: "Einladen" });
    fireEvent.click(approve);
    fireEvent.click(approve);

    await waitFor(() => expect(screen.getByRole("button", { name: "Ablehnen" })).toBeDisabled());
    expect(approve).toBeDisabled();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    resolve(reply(200, { status: "INVITED", email_sent: true }));
    await screen.findByText("Die Einladung wurde angelegt und per E-Mail versendet.");
    expect(screen.getByRole("button", { name: "Ablehnen" })).toBeEnabled();
  });

  it("replaces the buttons with the account notice on a 409", async () => {
    mockFetch.mockResolvedValue(reply(409, { error: { code: "EMAIL_TAKEN" } }));
    renderDecision();
    fireEvent.click(screen.getByRole("button", { name: "Einladen" }));

    expect(
      await screen.findByText("Für diese Adresse besteht bereits ein Konto."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Einladen" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Ablehnen" })).toBeNull();
  });

  it.each([
    [404, "Diese Anfrage gibt es nicht mehr. Möglicherweise ist sie abgelaufen."],
    [403, "Für diese Entscheidung fehlt die Berechtigung."],
    [500, "Die Entscheidung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut."],
  ])("shows a translated error for a %i and leaves the status unchanged", async (status, copy) => {
    mockFetch.mockResolvedValue(reply(status, { error: { code: "X" } }));
    renderDecision();
    fireEvent.click(screen.getByRole("button", { name: "Einladen" }));

    expect(await screen.findByText(copy)).toBeInTheDocument();
    expect(screen.getByText("Offen")).toBeInTheDocument();
    // Re-enabled so the operator can retry.
    expect(screen.getByRole("button", { name: "Einladen" })).toBeEnabled();
  });

  it("shows a network error when fetch rejects", async () => {
    mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));
    renderDecision();
    fireEvent.click(screen.getByRole("button", { name: "Ablehnen" }));
    expect(
      await screen.findByText("Keine Verbindung. Bitte versuchen Sie es erneut."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ablehnen" })).toBeEnabled();
  });

  it("clears a previous error when the operator tries again", async () => {
    mockFetch.mockResolvedValueOnce(reply(500, {}));
    mockFetch.mockResolvedValueOnce(reply(200, { status: "INVITED", email_sent: true }));
    renderDecision();
    fireEvent.click(screen.getByRole("button", { name: "Einladen" }));
    await screen.findByText(/konnte nicht gespeichert werden/);
    fireEvent.click(screen.getByRole("button", { name: "Einladen" }));
    await screen.findByText("Die Einladung wurde angelegt und per E-Mail versendet.");
    expect(screen.queryByText(/konnte nicht gespeichert werden/)).toBeNull();
  });
});
