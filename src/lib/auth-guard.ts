import { redirect } from "next/navigation";

import { auth } from "@/auth";
import type { SessionUser } from "@/types/auth";

/** Returns the current session user or null (no redirect). */
export async function requireUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as SessionUser;
}

/** Returns the current session user. Redirects to /auth/login if not authed. */
export async function requireUserOrRedirect(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }
  return session.user as SessionUser;
}
