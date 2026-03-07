import { beforeEach, describe, expect, it, vi } from "vitest";

// vi.hoisted ensures mockSend is available when the vi.mock factory is called
const { mockSend } = vi.hoisted(() => {
  return { mockSend: vi.fn().mockResolvedValue({ id: "test-id" }) };
});

vi.mock("resend", () => ({
  Resend: vi.fn(() => ({
    emails: { send: mockSend },
  })),
}));

vi.mock("@/lib/env", () => ({
  env: {
    RESEND_API_KEY: "re_test_key",
    RESEND_FROM_EMAIL: "noreply@evidoxa.dev",
    AUTH_URL: "https://evidoxa.dev",
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://localhost/test",
    DATABASE_URL_UNPOOLED: "postgresql://localhost/test",
    AUTH_SECRET: "test-secret-at-least-32-characters-long",
    BCRYPT_ROUNDS: 10,
    NEXT_PUBLIC_APP_URL: "https://evidoxa.dev",
  },
}));

import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";

describe("sendVerificationEmail", () => {
  beforeEach(() => {
    mockSend.mockClear();
    mockSend.mockResolvedValue({ id: "test-id" });
  });

  it("DE locale: subject is German, html contains ctaUrl, text fallback is non-empty", async () => {
    await sendVerificationEmail({
      to: "user@example.com",
      name: "Hans",
      token: "abc123",
      locale: "de",
    });

    expect(mockSend).toHaveBeenCalledOnce();
    const callArgs = mockSend.mock.calls[0] as [{ from: string; to: string; subject: string; html: string; text: string }];
    const call = callArgs[0];
    expect(call.subject).toBe("Bestätige deine E-Mail-Adresse");
    expect(call.html).toContain("https://evidoxa.dev/de/auth/verify?token=abc123");
    expect(call.text.length).toBeGreaterThan(0);
  });

  it("EN locale: subject is English", async () => {
    await sendVerificationEmail({
      to: "user@example.com",
      name: "John",
      token: "abc123",
      locale: "en",
    });

    expect(mockSend).toHaveBeenCalledOnce();
    const callArgs = mockSend.mock.calls[0] as [{ subject: string }];
    expect(callArgs[0].subject).toBe("Confirm your email address");
  });
});

describe("sendPasswordResetEmail", () => {
  beforeEach(() => {
    mockSend.mockClear();
    mockSend.mockResolvedValue({ id: "test-id" });
  });

  it("DE locale: subject is German, text contains token in URL", async () => {
    const token = "myresettoken456";
    await sendPasswordResetEmail({
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

  it("propagates errors from Resend", async () => {
    mockSend.mockRejectedValueOnce(new Error("Resend API error"));

    await expect(
      sendPasswordResetEmail({
        to: "user@example.com",
        name: "Hans",
        token: "tok",
        locale: "de",
      }),
    ).rejects.toThrow("Resend API error");
  });
});
