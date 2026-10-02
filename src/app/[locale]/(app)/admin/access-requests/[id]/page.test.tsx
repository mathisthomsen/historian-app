import { render, screen } from "@testing-library/react";
import { createTranslator } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import deMessages from "../../../../../../../messages/de.json";

const NOW = new Date("2026-10-02T12:00:00.000Z");
const HOUR = 60 * 60 * 1000;

const mockAuth = vi.fn();
const mockUserFindUnique = vi.fn();
const mockRequestFindUnique = vi.fn();

// Every write method the page's Prisma models expose. I8: a GET writes nothing.
const writeMocks = {
  userWrites: ["create", "update", "updateMany", "upsert", "delete", "deleteMany"].map(() =>
    vi.fn(),
  ),
  requestWrites: ["create", "update", "updateMany", "upsert", "delete", "deleteMany"].map(() =>
    vi.fn(),
  ),
  inviteWrites: ["create", "update", "updateMany", "upsert", "delete", "deleteMany"].map(() =>
    vi.fn(),
  ),
  transaction: vi.fn(),
  executeRaw: vi.fn(),
};
const WRITE_NAMES = ["create", "update", "updateMany", "upsert", "delete", "deleteMany"];
const named = (fns: ReturnType<typeof vi.fn>[]) =>
  Object.fromEntries(fns.map((fn, i) => [WRITE_NAMES[i]!, fn]));

vi.mock("@/auth", () => ({ auth: mockAuth }));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: mockUserFindUnique, ...named(writeMocks.userWrites) },
    accessRequest: { findUnique: mockRequestFindUnique, ...named(writeMocks.requestWrites) },
    invite: { ...named(writeMocks.inviteWrites) },
    $transaction: writeMocks.transaction,
    $executeRaw: writeMocks.executeRaw,
  },
}));

class NotFoundSignal extends Error {}
class RedirectSignal extends Error {
  constructor(public readonly to: string) {
    super(`redirect:${to}`);
  }
}
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new NotFoundSignal("NEXT_NOT_FOUND");
  },
  redirect: (to: string) => {
    throw new RedirectSignal(to);
  },
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));
vi.mock("next-intl/server", () => ({
  getTranslations: async (namespace: string) =>
    createTranslator({ locale: "de", messages: deMessages, namespace: namespace as never }),
}));

const { default: AccessRequestPage } =
  await import("@/app/[locale]/(app)/admin/access-requests/[id]/page");

function pageProps(id = "req-1", locale = "de") {
  return { params: Promise.resolve({ locale, id }) };
}

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: "req-1",
    email: "ada@example.org",
    name: "Ada Lovelace",
    institution: "Royal Society",
    research_area: "Analytical engines",
    tool_gap: "Line one\nLine two",
    locale: "en",
    status: "PENDING",
    created_at: new Date(NOW.getTime() - 2 * HOUR),
    status_changed_at: new Date(NOW.getTime() - 2 * HOUR),
    reviewed_at: null,
    reviewed_by_id: null,
    reviewed_by: null,
    invites: [],
    ...overrides,
  };
}

async function renderPage(props = pageProps()) {
  const element = await AccessRequestPage(props);
  return render(
    <NextIntlClientProvider locale="de" messages={deMessages}>
      {element}
    </NextIntlClientProvider>,
  );
}

function expectNoWrites() {
  for (const fn of [
    ...writeMocks.userWrites,
    ...writeMocks.requestWrites,
    ...writeMocks.inviteWrites,
    writeMocks.transaction,
    writeMocks.executeRaw,
  ]) {
    expect(fn).not.toHaveBeenCalled();
  }
}

describe("GET /[locale]/admin/access-requests/[id] (page)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    // Stale on purpose (A2): the session says ADMIN, the database decides.
    mockAuth.mockResolvedValue({ user: { id: "op-1", role: "ADMIN" } });
    mockUserFindUnique.mockImplementation(async (args: { where: { id?: string } }) =>
      args.where.id !== undefined ? { role: "ADMIN" } : null,
    );
    mockRequestFindUnique.mockResolvedValue(row());
  });

  describe("access", () => {
    it("redirects to the locale's login when there is no session", async () => {
      mockAuth.mockResolvedValue(null);
      await expect(AccessRequestPage(pageProps("req-1", "en"))).rejects.toMatchObject({
        to: "/en/auth/login",
      });
      expect(mockRequestFindUnique).not.toHaveBeenCalled();
    });

    it("404s when the session says ADMIN but the database says USER (I7)", async () => {
      mockUserFindUnique.mockImplementation(async (args: { where: { id?: string } }) =>
        args.where.id !== undefined ? { role: "USER" } : null,
      );
      await expect(AccessRequestPage(pageProps())).rejects.toBeInstanceOf(NotFoundSignal);
      // Not even a lookup: a non-operator must not learn whether an id exists.
      expect(mockRequestFindUnique).not.toHaveBeenCalled();
    });

    it("renders for an operator the database says is ADMIN, even if the session says USER", async () => {
      mockAuth.mockResolvedValue({ user: { id: "op-1", role: "USER" } });
      await renderPage();
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    });

    it("404s for an unknown id", async () => {
      mockRequestFindUnique.mockResolvedValue(null);
      await expect(AccessRequestPage(pageProps("nope"))).rejects.toBeInstanceOf(NotFoundSignal);
    });

    it("404s for an expired PENDING request (isExpired, at the 6 h deadline)", async () => {
      mockRequestFindUnique.mockResolvedValue(
        row({ status_changed_at: new Date(NOW.getTime() - 6 * HOUR) }),
      );
      await expect(AccessRequestPage(pageProps())).rejects.toBeInstanceOf(NotFoundSignal);
    });

    it("404s for an INVITED request with no live invite", async () => {
      mockRequestFindUnique.mockResolvedValue(
        row({
          status: "INVITED",
          invites: [{ used_at: null, expires_at: new Date(NOW.getTime() - 1) }],
        }),
      );
      await expect(AccessRequestPage(pageProps())).rejects.toBeInstanceOf(NotFoundSignal);
    });

    it("renders an INVITED request while an invite is live", async () => {
      mockRequestFindUnique.mockResolvedValue(
        row({
          status: "INVITED",
          invites: [{ used_at: null, expires_at: new Date(NOW.getTime() + HOUR) }],
        }),
      );
      await renderPage();
      expect(screen.getByText("Eingeladen")).toBeInTheDocument();
    });
  });

  describe("content", () => {
    it("shows every field of the request as text", async () => {
      await renderPage();
      expect(screen.getByRole("heading", { level: 1, name: "Zugangsanfrage" })).toBeInTheDocument();
      expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
      expect(screen.getByText("ada@example.org")).toBeInTheDocument();
      expect(screen.getByText("Royal Society")).toBeInTheDocument();
      expect(screen.getByText("Analytical engines")).toBeInTheDocument();
      expect(screen.getByText("Englisch")).toBeInTheDocument();
      expect(screen.getByText("Offen")).toBeInTheDocument();
      // created_at is 10:00Z, i.e. 12:00 in Europe/Berlin (UTC+2 on 2026-10-02).
      expect(screen.getByText(/02\.10\.2026/)).toBeInTheDocument();
      expect(screen.getByText(/12:00/)).toBeInTheDocument();
    });

    it("preserves whitespace in the tool-gap text", async () => {
      await renderPage();
      const value = screen.getByText(/Line one/);
      expect(value.textContent).toBe("Line one\nLine two");
      expect(value.className).toContain("whitespace-pre-wrap");
    });

    it("renders stranger-supplied text as text, never as markup", async () => {
      mockRequestFindUnique.mockResolvedValue(
        row({ tool_gap: "<img src=x onerror=alert(1)><script>alert(2)</script>" }),
      );
      const { container } = await renderPage();
      expect(container.querySelector("img")).toBeNull();
      expect(container.querySelector("script")).toBeNull();
      expect(screen.getByText(/<img src=x/)).toBeInTheDocument();
    });

    it("marks absent optional fields instead of leaving a blank", async () => {
      mockRequestFindUnique.mockResolvedValue(
        row({ institution: null, research_area: null, tool_gap: null }),
      );
      await renderPage();
      expect(screen.getAllByText("Nicht angegeben")).toHaveLength(3);
    });

    it("shows when and by whom a reviewed request was decided", async () => {
      mockRequestFindUnique.mockResolvedValue(
        row({
          status: "DECLINED",
          reviewed_at: new Date(NOW.getTime() - HOUR),
          reviewed_by_id: "op-2",
          reviewed_by: { name: "Grace Hopper", email: "grace@example.org" },
        }),
      );
      await renderPage();
      expect(screen.getByText(/von Grace Hopper/)).toBeInTheDocument();
    });

    it("shows no reviewer row for an unreviewed request", async () => {
      await renderPage();
      expect(screen.queryByText("Entschieden")).toBeNull();
    });

    it("replaces the buttons with the notice when an account already exists", async () => {
      mockUserFindUnique.mockImplementation(async (args: { where: { id?: string } }) =>
        args.where.id !== undefined ? { role: "ADMIN" } : { id: "existing" },
      );
      await renderPage();
      expect(screen.getByText("Für diese Adresse besteht bereits ein Konto.")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Einladen" })).toBeNull();
    });

    it("renders the decision control with both buttons for a decidable request", async () => {
      await renderPage();
      expect(screen.getByRole("button", { name: "Einladen" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Ablehnen" })).toBeInTheDocument();
    });
  });

  describe("I8 — a GET writes nothing", () => {
    it("calls no Prisma write for a renderable request", async () => {
      await renderPage();
      expectNoWrites();
    });

    it("calls no Prisma write on any 404 or redirect path either", async () => {
      mockRequestFindUnique.mockResolvedValue(null);
      await expect(AccessRequestPage(pageProps())).rejects.toBeInstanceOf(NotFoundSignal);
      mockUserFindUnique.mockResolvedValue({ role: "USER" });
      await expect(AccessRequestPage(pageProps())).rejects.toBeInstanceOf(NotFoundSignal);
      mockAuth.mockResolvedValue(null);
      await expect(AccessRequestPage(pageProps())).rejects.toBeInstanceOf(RedirectSignal);
      expectNoWrites();
    });

    it("opening the page twice leaves the same read-only footprint", async () => {
      await renderPage();
      await renderPage();
      expectNoWrites();
    });
  });
});
