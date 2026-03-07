import crypto from "crypto";

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function anonymizeIp(ip: string): string {
  if (ip.includes(":")) {
    const parts = ip.split(":");
    if (parts.length === 8) {
      return [...parts.slice(0, 4), "0", "0", "0", "0"].join(":");
    }
    return "::";
  }
  return ip.replace(/\.\d+$/, ".0");
}
