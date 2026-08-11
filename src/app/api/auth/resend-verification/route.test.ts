import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUserFindUnique = vi.fn();
const mockConfirmationCreate = vi.fn();
const mockConfirmationDeleteMany = vi.fn();
const mockSendVerificationEmail = vi.fn();
const mockWriteAuditLog = vi.fn();
const mockCheckRateLimit = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: mockUserFindUnique },
    emailConfirmation: {
      create: mockConfirmationCreate,
      deleteMany: mockConfirmationDeleteMany,
    },
  },
}));

vi.mock("@/lib/email", () => ({ sendVerificationEmail: mockSendVerificationEmail }));
vi.mock("@/lib/audit", () => ({ writeAuditLog: mockWriteAuditLog }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mockCheckRateLimit }));
vi.mock("@/lib/security", () => ({
  anonymizeIp: () => "anon",
  generateToken: () => "a".repeat(64),
  hashToken: (t: string) => `hash:${t}`,
}));

const { POST } = await import("@/app/api/auth/resend-verification/route");

function request(body: unknown): Request {
  return new Request("http://localhost/api/auth/resend-verification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/resend-verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue(null);
    mockConfirmationDeleteMany.mockResolvedValue({ count: 0 });
    mockConfirmationCreate.mockResolvedValue({});
    mockSendVerificationEmail.mockResolvedValue(undefined);
  });

  it("sends a new confirmation link for a pending account", async () => {
    mockUserFindUnique.mockResolvedValue({
      id: "u1",
      name: "Ada",
      email_verified_at: null,
    });

    const res = await POST(request({ email: "ada@example.com" }));

    expect(res.status).toBe(200);
    expect(mockSendVerificationEmail).toHaveBeenCalledOnce();
    // Outstanding links are superseded so only the newest one works.
    expect(mockConfirmationDeleteMany).toHaveBeenCalledWith({ where: { user_id: "u1" } });
    expect(mockConfirmationCreate).toHaveBeenCalledOnce();
  });

  it("returns the same 200 body for an unknown address, and sends nothing", async () => {
    mockUserFindUnique.mockResolvedValue(null);

    const res = await POST(request({ email: "nobody@example.com" }));

    expect(res.status).toBe(200);
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  it("returns the same 200 body for an already-verified address, and sends nothing", async () => {
    mockUserFindUnique.mockResolvedValue({
      id: "u2",
      name: "Bertha",
      email_verified_at: new Date(),
    });

    const res = await POST(request({ email: "bertha@example.com" }));

    expect(res.status).toBe(200);
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  it("is enumeration-neutral: all three cases are byte-identical", async () => {
    const bodies: string[] = [];

    mockUserFindUnique.mockResolvedValue({ id: "u1", name: "Ada", email_verified_at: null });
    bodies.push(await (await POST(request({ email: "a@example.com" }))).text());

    mockUserFindUnique.mockResolvedValue(null);
    bodies.push(await (await POST(request({ email: "b@example.com" }))).text());

    mockUserFindUnique.mockResolvedValue({ id: "u2", name: "B", email_verified_at: new Date() });
    bodies.push(await (await POST(request({ email: "c@example.com" }))).text());

    expect(new Set(bodies).size).toBe(1);
  });

  it("still returns 200 when the mail fails, and records the failure", async () => {
    mockUserFindUnique.mockResolvedValue({ id: "u1", name: "Ada", email_verified_at: null });
    mockSendVerificationEmail.mockRejectedValue(new Error("smtp down"));

    const res = await POST(request({ email: "ada@example.com" }));

    expect(res.status).toBe(200);
    expect(mockWriteAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "VERIFICATION_RESENT",
        metadata: expect.objectContaining({ email_sent: false }),
      }),
    );
  });

  it("honours the rate limiter", async () => {
    mockCheckRateLimit.mockResolvedValue(new Response(null, { status: 429 }));
    mockUserFindUnique.mockResolvedValue({ id: "u1", name: "Ada", email_verified_at: null });

    const res = await POST(request({ email: "ada@example.com" }));

    expect(res.status).toBe(429);
    expect(mockUserFindUnique).not.toHaveBeenCalled();
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  it("rejects a malformed address", async () => {
    const res = await POST(request({ email: "not-an-email" }));

    expect(res.status).toBe(400);
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });
});
