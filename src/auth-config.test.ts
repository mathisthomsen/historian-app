import { beforeEach, describe, expect, it, vi } from "vitest";

const isSessionRevoked = vi.fn();
vi.mock("@/lib/session-revocation", () => ({
  isSessionRevoked,
  revokeSessionsBefore: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

async function runSession(revoked: boolean) {
  isSessionRevoked.mockResolvedValue(revoked);
  const { authConfig } = await import("@/auth.config");
  const session = { user: { id: "", email: "a@b.c", name: null, role: "USER" }, expires: "" };
  const token = { id: "u1", role: "USER", iat: 1000 };
  return authConfig.callbacks!.session!({ session, token } as never);
}

describe("authConfig.session", () => {
  it("returns a populated session when the token is not revoked", async () => {
    const result = await runSession(false);
    expect(result.user?.id).toBe("u1");
  });

  it("strips user when the token is revoked, so every guard treats it as anonymous", async () => {
    const result = await runSession(true);
    expect(result.user).toBeUndefined();
  });
});
