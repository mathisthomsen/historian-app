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
  it("zeroes the last IPv4 octet", () => {
    expect(anonymizeIp("1.2.3.4")).toBe("1.2.3.0");
    expect(anonymizeIp("192.168.1.99")).toBe("192.168.1.0");
  });

  it("handles full IPv6 (8 groups — last 4 zeroed)", () => {
    const input = "2001:0db8:85a3:0000:0000:8a2e:0370:7334";
    const expected = "2001:0db8:85a3:0000:0:0:0:0";
    expect(anonymizeIp(input)).toBe(expected);
  });

  it("handles compressed IPv6 (has ':' but not 8 parts — returns '::')", () => {
    expect(anonymizeIp("::1")).toBe("::");
    expect(anonymizeIp("fe80::1")).toBe("::");
  });
});
