import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type * as EmailModule from "@/lib/email";
// The REAL sanitize — deliberately not mocked (P8): the safety of stranger text
// in the operator mail rests on what this function actually emits.
import { sanitize } from "@/lib/sanitize";

const { mockOperatorEmails, mockResend, mockSend, testEnv } = vi.hoisted(() => {
  const mockSend = vi.fn();
  return {
    mockOperatorEmails: vi.fn(),
    mockResend: vi.fn(() => ({ emails: { send: mockSend } })),
    mockSend,
    testEnv: {
      RESEND_API_KEY: "re_test_key",
      RESEND_FROM_EMAIL: "noreply@evidoxa.dev",
      AUTH_URL: "http://localhost:3000",
      EMAIL_TRANSPORT: "resend",
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://localhost/test",
      DATABASE_URL_UNPOOLED: "postgresql://localhost/test",
      AUTH_SECRET: "test-secret-at-least-32-characters-long",
      BCRYPT_ROUNDS: 10,
      // Deliberately different from AUTH_URL: mail links must come from AUTH_URL (D5).
      NEXT_PUBLIC_APP_URL: "https://app-url.example",
    },
  };
});

vi.mock("resend", () => ({
  Resend: mockResend,
}));

vi.mock("@/lib/env", () => ({
  env: testEnv,
}));

// access-retention (real, for the deadline) imports the Prisma client; no query runs here.
vi.mock("@/lib/db", () => ({ prisma: {} }));

vi.mock("@/lib/operators", () => ({
  operatorEmails: mockOperatorEmails,
}));

const senders = [
  {
    name: "verification",
    send: (email: typeof EmailModule) =>
      email.sendVerificationEmail({
        to: "user@example.com",
        name: "Hans",
        token: "abc123",
        locale: "de",
      }),
  },
  {
    name: "password reset",
    send: (email: typeof EmailModule) =>
      email.sendPasswordResetEmail({
        to: "user@example.com",
        name: "Hans",
        token: "abc123",
        locale: "de",
      }),
  },
  {
    name: "invite",
    send: (email: typeof EmailModule) =>
      email.sendInviteEmail({
        to: "user@example.com",
        name: "Hans",
        token: "abc123",
        locale: "de",
      }),
  },
];

async function loadEmail() {
  return import("@/lib/email");
}

describe("email transport", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useRealTimers();
    vi.unstubAllEnvs();
    testEnv.AUTH_URL = "http://localhost:3000";
    testEnv.EMAIL_TRANSPORT = "resend";
    testEnv.NODE_ENV = "test";
    mockResend.mockClear();
    mockSend.mockClear();
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("uses Resend by default and constructs the SDK only when an email is sent", async () => {
    const email = await loadEmail();
    expect(mockResend).not.toHaveBeenCalled();

    await email.sendVerificationEmail({
      to: "user@example.com",
      name: "Hans",
      token: "abc123",
      locale: "de",
    });

    expect(mockSend).toHaveBeenCalledOnce();
    expect(mockResend).toHaveBeenCalledOnce();
    const callArgs = mockSend.mock.calls[0] as [
      { from: string; to: string; subject: string; html: string; text: string },
    ];
    const call = callArgs[0];
    expect(call.subject).toBe("Bestätige deine E-Mail-Adresse");
    expect(call.html).toContain("http://localhost:3000/de/auth/verify?token=abc123");
    expect(call.text.length).toBeGreaterThan(0);
  });

  it("formats English verification emails", async () => {
    const email = await loadEmail();
    await email.sendVerificationEmail({
      to: "user@example.com",
      name: "John",
      token: "abc123",
      locale: "en",
    });

    expect(mockSend).toHaveBeenCalledOnce();
    const callArgs = mockSend.mock.calls[0] as [{ subject: string }];
    expect(callArgs[0].subject).toBe("Confirm your email address");
  });

  it("formats password reset emails", async () => {
    const email = await loadEmail();
    const token = "myresettoken456";
    await email.sendPasswordResetEmail({
      to: "user@example.com",
      name: "Hans",
      token,
      locale: "de",
    });

    expect(mockSend).toHaveBeenCalledOnce();
    const callArgs = mockSend.mock.calls[0] as [{ subject: string; text: string }];
    expect(callArgs[0].subject).toBe("Passwort zurücksetzen");
    expect(callArgs[0].text).toContain(token);
  });

  it.each(senders)(
    "returns successfully for $name email when Resend accepts it",
    async ({ send }) => {
      const email = await loadEmail();
      await expect(send(email)).resolves.toBeUndefined();
    },
  );

  it.each(senders)("throws the resolved provider error for $name email", async ({ send }) => {
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { name: "application_error", message: "Resend API error" },
    });
    const email = await loadEmail();

    await expect(send(email)).rejects.toThrow("Resend API error");
  });

  it.each(senders)("throws a rejected provider error for $name email", async ({ send }) => {
    mockSend.mockRejectedValueOnce(new Error("Resend request rejected"));
    const email = await loadEmail();

    await expect(send(email)).rejects.toThrow("Resend request rejected");
  });

  it.each(senders)("clears the deadline after a successful $name email", async ({ send }) => {
    vi.useFakeTimers();
    const email = await loadEmail();
    const pending = send(email);

    expect(vi.getTimerCount()).toBe(1);
    await pending;
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each(senders)(
    "clears the deadline after a provider error for $name email",
    async ({ send }) => {
      vi.useFakeTimers();
      mockSend.mockResolvedValueOnce({
        data: null,
        error: { name: "application_error", message: "Resend API error" },
      });
      const email = await loadEmail();
      const promise = send(email);
      const pending = expect(promise).rejects.toThrow("Resend API error");
      const notDeadline = promise.catch((err: unknown) => err);

      expect(vi.getTimerCount()).toBe(1);
      await pending;
      // A definite provider error is NOT a deadline error.
      expect(await notDeadline).not.toBeInstanceOf(email.EmailDeadlineError);
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it.each(senders)("times out a hung Resend request for $name email", async ({ send }) => {
    vi.useFakeTimers();
    let rejectLate!: (reason?: unknown) => void;
    mockSend.mockReturnValueOnce(
      new Promise((_, reject) => {
        rejectLate = reject;
      }),
    );
    const email = await loadEmail();
    const pending = send(email);
    const timedOut = expect(pending).rejects.toThrow("Email delivery request timed out.");
    // A caller must be able to tell "we stopped waiting" from "the provider said no".
    const isDeadlineError = expect(pending).rejects.toBeInstanceOf(email.EmailDeadlineError);

    await vi.advanceTimersByTimeAsync(5_000);
    await timedOut;
    await isDeadlineError;
    expect(vi.getTimerCount()).toBe(0);

    rejectLate(new Error("late provider rejection"));
    await Promise.resolve();
  });

  it.each(senders)(
    "does not construct Resend or send $name mail with the local stub transport",
    async ({ send }) => {
      testEnv.EMAIL_TRANSPORT = "stub";
      testEnv.NODE_ENV = "production";
      const email = await loadEmail();

      await expect(send(email)).resolves.toBeUndefined();

      expect(mockResend).not.toHaveBeenCalled();
      expect(mockSend).not.toHaveBeenCalled();
    },
  );

  it("refuses the stub transport on Vercel", async () => {
    testEnv.EMAIL_TRANSPORT = "stub";
    vi.stubEnv("VERCEL", "1");
    const email = await loadEmail();

    await expect(
      email.sendVerificationEmail({
        to: "user@example.com",
        name: "Hans",
        token: "abc123",
        locale: "de",
      }),
    ).rejects.toThrow("only permitted for local development");
    expect(mockResend).not.toHaveBeenCalled();
  });

  it("refuses the stub transport for a non-local AUTH_URL", async () => {
    testEnv.EMAIL_TRANSPORT = "stub";
    testEnv.AUTH_URL = "https://evidoxa.dev";
    const email = await loadEmail();

    await expect(
      email.sendVerificationEmail({
        to: "user@example.com",
        name: "Hans",
        token: "abc123",
        locale: "de",
      }),
    ).rejects.toThrow("only permitted for local development");
    expect(mockResend).not.toHaveBeenCalled();
  });
});

type SentMessage = { from: string; to: string; subject: string; html: string; text: string };

function sentMessages(): SentMessage[] {
  return mockSend.mock.calls.map((call) => call[0] as SentMessage);
}

/** Every element in the document as "tag[attr,attr]" — the markup skeleton. */
function skeleton(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return Array.from(doc.querySelectorAll("*")).map(
    (el) =>
      `${el.tagName.toLowerCase()}[${Array.from(el.attributes)
        .map((a) => a.name)
        .sort()
        .join(",")}]`,
  );
}

const baseRequest = {
  requestId: "req_1",
  name: "Ada Lovelace",
  email: "ada@example.org",
  institution: "Royal Society",
  researchArea: "Analytical engines",
  toolGap: "Which sources cite this letter?",
  locale: "de" as const,
  statusChangedAt: new Date("2026-07-01T21:00:00.000Z"), // deadline 03:00Z = 05:00 Berlin (CEST)
};

describe("sendAccessRequestNotification", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useRealTimers();
    vi.unstubAllEnvs();
    testEnv.AUTH_URL = "http://localhost:3000";
    testEnv.EMAIL_TRANSPORT = "resend";
    mockResend.mockClear();
    mockSend.mockClear();
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
    mockOperatorEmails.mockReset();
    mockOperatorEmails.mockResolvedValue(["op1@example.org"]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends one German mail to each operator, individually", async () => {
    mockOperatorEmails.mockResolvedValue(["op1@example.org", "op2@example.org"]);
    const email = await loadEmail();
    await email.sendAccessRequestNotification(baseRequest);

    const sent = sentMessages();
    expect(sent.map((m) => m.to)).toEqual(["op1@example.org", "op2@example.org"]);
    expect(sent[0]?.from).toBe("noreply@evidoxa.dev");
  });

  it("states the subject with name and the deadline as a Berlin clock time", async () => {
    const email = await loadEmail();
    await email.sendAccessRequestNotification(baseRequest);

    expect(sentMessages()[0]?.subject).toBe("Neue Zugangsanfrage: Ada Lovelace — verfällt 05:00");
  });

  it.each([
    ["summer time (CEST, UTC+2)", "2026-07-01T21:00:00.000Z", "05:00"],
    ["winter time (CET, UTC+1)", "2026-12-01T21:00:00.000Z", "04:00"],
    ["midnight renders 00:00, not 24:00", "2026-07-01T16:00:00.000Z", "00:00"],
    [
      "the offset is the one at the deadline, across the March DST change",
      "2026-03-28T23:30:00.000Z",
      "07:30",
    ],
    [
      "the offset is the one at the deadline, across the October DST change",
      "2026-10-24T21:30:00.000Z",
      "04:30",
    ],
  ])("deadline in Europe/Berlin: %s", async (_label, createdAt, expected) => {
    const email = await loadEmail();
    await email.sendAccessRequestNotification({
      ...baseRequest,
      statusChangedAt: new Date(createdAt),
    });

    const sent = sentMessages()[0];
    expect(sent?.subject).toMatch(new RegExp(`verfällt ${expected}$`));
    expect(sent?.html).toContain(expected);
    expect(sent?.text).toContain(expected);
  });

  it("links to the confirmation page under AUTH_URL, always /de, never NEXT_PUBLIC_APP_URL (D5)", async () => {
    const email = await loadEmail();
    await email.sendAccessRequestNotification({ ...baseRequest, locale: "en" });

    const sent = sentMessages()[0];
    const link = "http://localhost:3000/de/admin/access-requests/req_1";
    expect(sent?.html).toContain(`href="${link}"`);
    expect(sent?.text).toContain(link);
    expect(sent?.html).not.toContain("app-url.example");
    expect(sent?.text).not.toContain("app-url.example");
  });

  it("tells a signed-out operator what to do", async () => {
    const email = await loadEmail();
    await email.sendAccessRequestNotification(baseRequest);

    const phrase =
      "Falls Sie nicht angemeldet sind: erst anmelden, dann diesen Link erneut öffnen.";
    expect(sentMessages()[0]?.html).toContain(phrase);
    expect(sentMessages()[0]?.text).toContain(phrase);
  });

  it("shows the request fields", async () => {
    const email = await loadEmail();
    await email.sendAccessRequestNotification(baseRequest);

    const html = sentMessages()[0]?.html ?? "";
    for (const value of [
      "Ada Lovelace",
      "ada@example.org",
      "Royal Society",
      "Analytical engines",
      "Which sources cite this letter?",
    ]) {
      expect(html).toContain(value);
    }
  });

  it("omits optional fields that were not given", async () => {
    const email = await loadEmail();
    await email.sendAccessRequestNotification({
      ...baseRequest,
      institution: null,
      researchArea: null,
      toolGap: null,
    });

    const html = sentMessages()[0]?.html ?? "";
    expect(html).not.toContain("null");
    expect(html).not.toContain("undefined");
  });

  it("logs and sends nothing when there is no operator to notify", async () => {
    mockOperatorEmails.mockResolvedValue([]);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const email = await loadEmail();

    await expect(email.sendAccessRequestNotification(baseRequest)).resolves.toBeUndefined();

    expect(mockSend).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith("[access-request] no operator to notify", {
      requestId: "req_1",
    });
  });

  it("still delivers to the other operators when one delivery fails", async () => {
    mockOperatorEmails.mockResolvedValue(["op1@example.org", "op2@example.org"]);
    mockSend.mockRejectedValueOnce(new Error("mailbox unavailable"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const email = await loadEmail();

    await expect(email.sendAccessRequestNotification(baseRequest)).resolves.toBeUndefined();
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("rejects when every delivery fails, so the caller can log it (I12 is the caller's)", async () => {
    mockOperatorEmails.mockResolvedValue(["op1@example.org", "op2@example.org"]);
    mockSend.mockRejectedValue(new Error("Resend request rejected"));
    const email = await loadEmail();

    await expect(email.sendAccessRequestNotification(baseRequest)).rejects.toThrow(
      "Resend request rejected",
    );
  });

  it("rejects when the operator lookup itself fails", async () => {
    mockOperatorEmails.mockRejectedValue(new Error("db down"));
    const email = await loadEmail();

    await expect(email.sendAccessRequestNotification(baseRequest)).rejects.toThrow("db down");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("does not construct Resend with the local stub transport", async () => {
    testEnv.EMAIL_TRANSPORT = "stub";
    const email = await loadEmail();

    await expect(email.sendAccessRequestNotification(baseRequest)).resolves.toBeUndefined();
    expect(mockResend).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("keeps stranger text out of the subject's line structure", async () => {
    const email = await loadEmail();
    await email.sendAccessRequestNotification({
      ...baseRequest,
      name: "Ada\r\nBcc: attacker@example.org",
    });

    expect(sentMessages()[0]?.subject).not.toMatch(/[\r\n]/);
  });

  // P8 — the real sanitize, then the real template. The invariant is that the
  // document's markup skeleton (tags and attribute names) is exactly the one a
  // benign request produces, so a stranger's text can add no element and no
  // attribute. Comparing against the benign skeleton is stronger than grepping
  // for known-bad strings.
  describe("P8: sanitized stranger text is inert in the notification HTML", () => {
    const payloads = [
      `<script>alert(1)</script>`,
      `<img src=x onerror=alert(1)>`,
      `"><svg/onload=alert(1)>`,
      `a" onmouseover="alert(1)`,
      `'><a href="javascript:alert(1)">x</a>`,
      `<<img src=x onerror=1>`,
      `<scr<script>ipt>alert(1)</scr</script>ipt>`,
      `</p></body><script>alert(1)</script>`,
      `Tom & Jerry <b>bold</b> 1 < 2 > 0`,
    ];

    it.each(payloads)("payload %j", async (payload) => {
      const email = await loadEmail();

      await email.sendAccessRequestNotification(baseRequest);
      const benign = skeleton(sentMessages()[0]?.html ?? "");
      mockSend.mockClear();

      // Prefixed so a payload that sanitizes to "" does not drop the field's row
      // and change the skeleton for a reason that has nothing to do with injection.
      const hostile = sanitize(`Ada ${payload}`);
      await email.sendAccessRequestNotification({
        ...baseRequest,
        name: hostile,
        institution: hostile,
        researchArea: hostile,
        toolGap: hostile,
      });

      const html = sentMessages()[0]?.html ?? "";
      expect(skeleton(html)).toEqual(benign);
      expect(html).not.toMatch(/<script/i);
      expect(html).not.toMatch(/<img/i);
      expect(html).not.toMatch(/<svg/i);
    });
  });
});

describe("sendInviteEmail", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useRealTimers();
    testEnv.AUTH_URL = "http://localhost:3000";
    testEnv.EMAIL_TRANSPORT = "resend";
    mockResend.mockClear();
    mockSend.mockClear();
    mockSend.mockResolvedValue({ data: { id: "test-id" }, error: null });
  });

  const RAW = "f".repeat(64);

  it("sends the German invite with a register link under AUTH_URL in the request's locale", async () => {
    const email = await loadEmail();
    await email.sendInviteEmail({ to: "ada@example.org", name: "Ada", token: RAW, locale: "de" });

    const sent = sentMessages()[0];
    const link = `http://localhost:3000/de/auth/register?invite=${RAW}`;
    expect(sent?.to).toBe("ada@example.org");
    expect(sent?.subject).toBe("Ihre Einladung zu Evidoxa");
    expect(sent?.html).toContain(`href="${link}"`);
    expect(sent?.text).toContain(link);
  });

  it("sends the English invite with an /en/ link", async () => {
    const email = await loadEmail();
    await email.sendInviteEmail({ to: "ada@example.org", name: "Ada", token: RAW, locale: "en" });

    const sent = sentMessages()[0];
    const link = `http://localhost:3000/en/auth/register?invite=${RAW}`;
    expect(sent?.subject).toBe("Your invitation to Evidoxa");
    expect(sent?.html).toContain(`href="${link}"`);
    expect(sent?.text).toContain(link);
  });

  it("builds the link from AUTH_URL, not NEXT_PUBLIC_APP_URL (D5)", async () => {
    testEnv.AUTH_URL = "http://localhost:4000";
    const email = await loadEmail();
    await email.sendInviteEmail({ to: "ada@example.org", name: "Ada", token: RAW, locale: "de" });

    const sent = sentMessages()[0];
    expect(sent?.html).toContain("http://localhost:4000/de/auth/register?invite=");
    expect(sent?.html).not.toContain("app-url.example");
    expect(sent?.text).not.toContain("app-url.example");
  });

  it("states the 14-day expiry in each language", async () => {
    const email = await loadEmail();
    await email.sendInviteEmail({ to: "a@example.org", name: "Ada", token: RAW, locale: "de" });
    await email.sendInviteEmail({ to: "a@example.org", name: "Ada", token: RAW, locale: "en" });

    const [de, en] = sentMessages();
    expect(de?.html).toContain("14 Tage");
    expect(de?.text).toContain("14 Tage");
    expect(en?.html).toContain("14 days");
    expect(en?.text).toContain("14 days");
  });

  it("states that the invitation is bound to this address", async () => {
    const email = await loadEmail();
    await email.sendInviteEmail({ to: "a@example.org", name: "Ada", token: RAW, locale: "de" });
    await email.sendInviteEmail({ to: "a@example.org", name: "Ada", token: RAW, locale: "en" });

    const [de, en] = sentMessages();
    expect(de?.text).toContain("nicht geändert");
    expect(en?.text).toContain("cannot be changed");
  });

  it("never puts a locale outside de/en into the link path", async () => {
    const email = await loadEmail();
    await email.sendInviteEmail({
      to: "a@example.org",
      name: "Ada",
      token: RAW,
      locale: "../../evil",
    });

    expect(sentMessages()[0]?.text).toContain("http://localhost:3000/en/auth/register?invite=");
  });

  it("P8: a sanitized hostile name adds no markup to the invite", async () => {
    const email = await loadEmail();
    await email.sendInviteEmail({ to: "a@example.org", name: "Ada", token: RAW, locale: "de" });
    const benign = skeleton(sentMessages()[0]?.html ?? "");
    mockSend.mockClear();

    await email.sendInviteEmail({
      to: "a@example.org",
      name: sanitize(`"><img src=x onerror=alert(1)><script>alert(1)</script>`),
      token: RAW,
      locale: "de",
    });

    expect(skeleton(sentMessages()[0]?.html ?? "")).toEqual(benign);
  });
});
