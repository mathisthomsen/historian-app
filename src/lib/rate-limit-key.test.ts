import { afterEach, describe, expect, it } from "vitest";

import { RATE_LIMIT_BASE_PREFIX, purgeablePrefix, rateLimitPrefix } from "@/lib/rate-limit-key";

const ORIGINAL = process.env["RATELIMIT_NAMESPACE"];

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env["RATELIMIT_NAMESPACE"];
  else process.env["RATELIMIT_NAMESPACE"] = ORIGINAL;
});

describe("rateLimitPrefix", () => {
  it("returns the bare prefix when no namespace is configured", () => {
    expect(rateLimitPrefix(undefined)).toBe(RATE_LIMIT_BASE_PREFIX);
  });

  it("appends the namespace as a key segment when one is configured", () => {
    expect(rateLimitPrefix("ci-42-1")).toBe(`${RATE_LIMIT_BASE_PREFIX}:ci-42-1`);
  });

  it("treats an empty namespace as unset, rather than producing a trailing colon", () => {
    expect(rateLimitPrefix("")).toBe(RATE_LIMIT_BASE_PREFIX);
  });

  it("reads RATELIMIT_NAMESPACE from the environment by default", () => {
    process.env["RATELIMIT_NAMESPACE"] = "from-env";
    expect(rateLimitPrefix()).toBe(`${RATE_LIMIT_BASE_PREFIX}:from-env`);
  });
});

describe("purgeablePrefix", () => {
  // The whole point of this function: a test run must never be able to issue a
  // DEL against keys it does not own. Production's buckets live under the bare
  // prefix, so refusing to build a purge target without a namespace is what
  // makes wiping them impossible rather than merely unlikely.
  it("throws when no namespace is configured, so unnamespaced keys can never be purged", () => {
    expect(() => purgeablePrefix(undefined)).toThrow(/namespace/i);
  });

  it("throws on an empty namespace, which would otherwise match every key", () => {
    expect(() => purgeablePrefix("")).toThrow(/namespace/i);
  });

  it("returns a prefix scoped to the namespace when one is configured", () => {
    expect(purgeablePrefix("ci-42-1")).toBe(`${RATE_LIMIT_BASE_PREFIX}:ci-42-1`);
  });

  it("never returns the bare prefix, which is what production uses", () => {
    expect(purgeablePrefix("anything")).not.toBe(RATE_LIMIT_BASE_PREFIX);
  });

  it("reads RATELIMIT_NAMESPACE from the environment by default", () => {
    process.env["RATELIMIT_NAMESPACE"] = "local-e2e";
    expect(purgeablePrefix()).toBe(`${RATE_LIMIT_BASE_PREFIX}:local-e2e`);
  });
});
