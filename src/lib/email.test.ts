import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type * as EmailModule from "@/lib/email";

const { mockResend, mockSend, testEnv } = vi.hoisted(() => {
  const mockSend = vi.fn();
  return {
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
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    },
  };
});

vi.mock("resend", () => ({
  Resend: mockResend,
}));

vi.mock("@/lib/env", () => ({
  env: testEnv,
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
      const pending = expect(send(email)).rejects.toThrow("Resend API error");

      expect(vi.getTimerCount()).toBe(1);
      await pending;
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

    await vi.advanceTimersByTimeAsync(5_000);
    await timedOut;
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
