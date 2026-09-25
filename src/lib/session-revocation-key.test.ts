import { afterEach, describe, expect, it } from "vitest";

import { SESSION_REVOCATION_PREFIX, sessionRevocationKey } from "@/lib/session-revocation-key";

const ORIGINAL = process.env["CACHE_NAMESPACE"];
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env["CACHE_NAMESPACE"];
  else process.env["CACHE_NAMESPACE"] = ORIGINAL;
});

describe("sessionRevocationKey", () => {
  it("uses the bare prefix when no namespace is configured", () => {
    expect(sessionRevocationKey("user-1", undefined)).toBe(`${SESSION_REVOCATION_PREFIX}:user-1`);
  });

  it("inserts the namespace before the user id, so CI cannot write production's key", () => {
    expect(sessionRevocationKey("user-1", "ci-42-1")).toBe(
      `${SESSION_REVOCATION_PREFIX}:ci-42-1:user-1`,
    );
  });

  it("treats an empty namespace as unset rather than producing a double colon", () => {
    expect(sessionRevocationKey("user-1", "")).toBe(`${SESSION_REVOCATION_PREFIX}:user-1`);
  });

  it("reads CACHE_NAMESPACE from the environment by default", () => {
    process.env["CACHE_NAMESPACE"] = "from-env";
    expect(sessionRevocationKey("user-1")).toBe(`${SESSION_REVOCATION_PREFIX}:from-env:user-1`);
  });
});
