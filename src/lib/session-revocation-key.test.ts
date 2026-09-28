import { afterEach, describe, expect, it, vi } from "vitest";

import { SESSION_REVOCATION_PREFIX, sessionRevocationKey } from "@/lib/session-revocation-key";

const ORIGINAL_NAMESPACE = process.env["CACHE_NAMESPACE"];
afterEach(() => {
  if (ORIGINAL_NAMESPACE === undefined) delete process.env["CACHE_NAMESPACE"];
  else process.env["CACHE_NAMESPACE"] = ORIGINAL_NAMESPACE;
  vi.unstubAllEnvs();
});

describe("sessionRevocationKey", () => {
  it("inserts the namespace before the user id, so CI cannot write production's key", () => {
    expect(sessionRevocationKey("user-1", "ci-42-1")).toBe(
      `${SESSION_REVOCATION_PREFIX}:ci-42-1:user-1`,
    );
  });

  it("reads CACHE_NAMESPACE from the environment by default", () => {
    process.env["CACHE_NAMESPACE"] = "from-env";
    expect(sessionRevocationKey("user-1")).toBe(`${SESSION_REVOCATION_PREFIX}:from-env:user-1`);
  });

  it("throws when no namespace is configured outside production, rather than sharing production's key space (#124)", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(() => sessionRevocationKey("user-1", undefined)).toThrow(/CACHE_NAMESPACE/);
  });

  it("treats an empty namespace the same as unset — it still throws outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(() => sessionRevocationKey("user-1", "")).toThrow(/CACHE_NAMESPACE/);
  });

  it("throws in test too, not only in development — the guard is 'anything but production'", () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(() => sessionRevocationKey("user-1", undefined)).toThrow(/CACHE_NAMESPACE/);
  });

  it("returns the bare key in production even with no namespace configured, since that is production's own key space", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(sessionRevocationKey("user-1", undefined)).toBe(`${SESSION_REVOCATION_PREFIX}:user-1`);
  });

  it("still namespaces in production when CACHE_NAMESPACE happens to be set", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(sessionRevocationKey("user-1", "ci-42-1")).toBe(
      `${SESSION_REVOCATION_PREFIX}:ci-42-1:user-1`,
    );
  });
});
