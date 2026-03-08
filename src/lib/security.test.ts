import { describe, expect, it } from "vitest";

import { anonymizeIp, generateToken, hashToken } from "@/lib/security";

describe("generateToken", () => {
  it("produces a 64-character hex string", () => {
    const token = generateToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is unique each call", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
  });
});

describe("hashToken", () => {
  it("is deterministic", () => {
    const raw = "some-raw-token";
    expect(hashToken(raw)).toBe(hashToken(raw));
  });

  it("produces a 64-character hex string", () => {
    const hash = hashToken("test");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("anonymizeIp", () => {
  it("returns a 64-character hex string (HMAC-SHA256)", () => {
    const result = anonymizeIp("192.168.1.42");
    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic (same IP → same hash)", () => {
    expect(anonymizeIp("10.0.0.1")).toBe(anonymizeIp("10.0.0.1"));
  });

  it("different IPs produce different hashes", () => {
    expect(anonymizeIp("1.2.3.4")).not.toBe(anonymizeIp("5.6.7.8"));
  });

  it("does not include the raw IP in the output", () => {
    const ip = "203.0.113.99";
    const result = anonymizeIp(ip);
    // The full IP string must not appear in the hash
    expect(result).not.toContain(ip);
    // The result must be purely hex characters (not an IP address format)
    expect(result).not.toContain(".");
    expect(result).not.toContain(":");
  });

  it("handles IPv6 addresses", () => {
    const result = anonymizeIp("2001:0db8:85a3::8a2e:0370:7334");
    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[0-9a-f]{64}$/);
  });
});
