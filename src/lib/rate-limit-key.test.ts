import { afterEach, describe, expect, it } from "vitest";

import { RATE_LIMIT_BASE_PREFIX, purgeablePrefix, rateLimitPrefix } from "@/lib/rate-limit-key";

const ORIGINAL = process.env["RATELIMIT_NAMESPACE"];
const ORIGINAL_VERCEL_ENV = process.env["VERCEL_ENV"];

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env["RATELIMIT_NAMESPACE"];
  else process.env["RATELIMIT_NAMESPACE"] = ORIGINAL;
  if (ORIGINAL_VERCEL_ENV === undefined) delete process.env["VERCEL_ENV"];
  else process.env["VERCEL_ENV"] = ORIGINAL_VERCEL_ENV;
});

describe("rateLimitPrefix", () => {
  // Local development and production share one Upstash instance (measured —
  // .env.local and `vercel env pull --environment=production` resolve to the
  // same host), and rate-limit buckets are keyed by action and anonymised IP
  // — values that collide across environments. Refusing to build an
  // unnamespaced prefix outside production is what stops a developer hammering
  // a form locally from spending a real user's rate-limit budget (#124).
  //
  // "Outside production" is `VERCEL_ENV !== "production"`, not `NODE_ENV` — a
  // `next start` production build on a laptop also has `NODE_ENV ===
  // "production"` and must not get a free pass (round 2 of #124).
  //
  // Each test below that means to exercise the "unset" path also deletes
  // RATELIMIT_NAMESPACE itself, rather than relying on it happening to be
  // absent from the runner's shell: passing `undefined` only reaches
  // rateLimitPrefix()'s default parameter (which reads the env var) when no
  // other value is supplied, so an ambient RATELIMIT_NAMESPACE — e.g. one a
  // developer exported locally, per the README instruction this PR adds —
  // would otherwise leak into these "unset" cases and flip their assertions.
  it("throws when no namespace is configured outside production", () => {
    delete process.env["RATELIMIT_NAMESPACE"];
    delete process.env["VERCEL_ENV"];
    expect(() => rateLimitPrefix(undefined)).toThrow(/RATELIMIT_NAMESPACE/);
  });

  it("throws on an empty namespace outside production, rather than producing a trailing colon", () => {
    delete process.env["VERCEL_ENV"];
    expect(() => rateLimitPrefix("")).toThrow(/RATELIMIT_NAMESPACE/);
  });

  it("returns the bare prefix in production when no namespace is configured — production is its own key space", () => {
    delete process.env["RATELIMIT_NAMESPACE"];
    process.env["VERCEL_ENV"] = "production";
    expect(rateLimitPrefix(undefined)).toBe(RATE_LIMIT_BASE_PREFIX);
  });

  it("appends the namespace as a key segment when one is configured", () => {
    expect(rateLimitPrefix("ci-42-1")).toBe(`${RATE_LIMIT_BASE_PREFIX}:ci-42-1`);
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
    // See the comment in the "rateLimitPrefix" describe above: `undefined`
    // only reaches the default parameter (the env var) when the var is
    // actually unset, so it must be deleted here rather than assumed absent.
    delete process.env["RATELIMIT_NAMESPACE"];
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
