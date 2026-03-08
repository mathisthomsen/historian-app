import crypto from "crypto";

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Produces a one-way HMAC-SHA256 hash of an IP address using AUTH_SECRET as
 * the key. The result is deterministic (same IP + same secret = same hash) but
 * cannot be reversed to the original IP, satisfying GDPR/DSGVO pseudonymisation
 * requirements for data stored in Redis rate-limit keys.
 */
export function anonymizeIp(ip: string): string {
  const secret = process.env.AUTH_SECRET ?? "dev-anonymization-secret";
  return crypto.createHmac("sha256", secret).update(ip).digest("hex");
}
