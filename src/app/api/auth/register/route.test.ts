import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  findUser: vi.fn(),
  createUser: vi.fn(),
  createConfirmation: vi.fn(),
  audit: vi.fn(),
}));

vi.mock("resend", () => ({ Resend: vi.fn(() => ({ emails: { send: mocks.send } })) }));
vi.mock("@/lib/env", () => ({
  env: {
    EMAIL_TRANSPORT: "resend",
    RESEND_API_KEY: "re_test_key",
    RESEND_FROM_EMAIL: "noreply@example.com",
    AUTH_URL: "http://localhost:3000",
    BCRYPT_ROUNDS: 10,
  },
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: mocks.findUser, create: mocks.createUser },
    emailConfirmation: { create: mocks.createConfirmation },
  },
}));
vi.mock("@/lib/audit", () => ({ writeAuditLog: mocks.audit }));
vi.mock("@/lib/api", () => ({ jsonError: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: vi.fn().mockResolvedValue(null) }));
vi.mock("bcryptjs", () => ({ default: { hash: vi.fn().mockResolvedValue("password-hash") } }));
vi.mock("@/lib/security", () => ({
  anonymizeIp: () => "anon",
  generateToken: () => "confirmation-token",
  hashToken: () => "confirmation-token-hash",
}));

import { POST } from "./route";

function register(): Promise<Response> {
  return POST(
    new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ada@example.com", name: "Ada", password: "Password123!" }),
    }),
  );
}

describe("registration email delivery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.findUser.mockResolvedValue(null);
    mocks.createUser.mockResolvedValue({ id: "new-user" });
    mocks.createConfirmation.mockResolvedValue({});
    mocks.audit.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("finishes registration with a recorded failure when the provider never settles", async () => {
    mocks.send.mockReturnValue(new Promise(() => {}));
    let response: Response | undefined;
    const pending = register().then((result) => {
      response = result;
    });

    await vi.advanceTimersByTimeAsync(5_000);

    expect(response, "registration must finish within the email deadline").toBeDefined();
    await pending;
    expect(response!.status).toBe(201);
    expect(await response!.json()).toEqual({
      message: "auth.register.verificationSent",
      email_sent: false,
    });
    expect(mocks.createUser).toHaveBeenCalledOnce();
    expect(mocks.createConfirmation).toHaveBeenCalledOnce();
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "REGISTER",
        userId: "new-user",
        metadata: { email_sent: false, email_error: expect.any(String) },
      }),
    );
    expect(vi.getTimerCount()).toBe(0);
  });

  it("reports a resolved provider rejection as a failed email", async () => {
    mocks.send.mockResolvedValue({
      data: null,
      error: { name: "validation_error", message: "Invalid sender" },
    });

    const response = await register();

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(expect.objectContaining({ email_sent: false }));
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { email_sent: false, email_error: expect.stringContaining("Invalid sender") },
      }),
    );
  });

  it("reports accepted mail as sent", async () => {
    mocks.send.mockResolvedValue({ data: { id: "email-id" }, error: null });

    const response = await register();

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(expect.objectContaining({ email_sent: true }));
    expect(vi.getTimerCount()).toBe(0);
  });
});
