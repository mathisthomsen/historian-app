import { prisma } from "@/lib/db";

/**
 * Whether `userId` is an operator RIGHT NOW (I7, A2).
 *
 * Reads `User.role` from the database on every call. The session's `role` is
 * written once at sign-in and is stale for up to 30 days (A2), so it must
 * never be consulted for an authorisation decision — and this function must
 * never cache or memoise, or a demoted admin keeps approving.
 */
export async function isOperator(userId: string): Promise<boolean> {
  if (!userId) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

/**
 * Addresses to notify about a new access request (§7.1): verified ADMIN users,
 * queried at send time. An unverified admin receives nothing.
 */
export async function operatorEmails(): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", email_verified_at: { not: null } },
    select: { email: true },
  });
  return admins.map((admin) => admin.email);
}
