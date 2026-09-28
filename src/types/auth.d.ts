import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: UserRole;
      projectId?: string;
    };
  }
  interface User {
    id: string;
    role: UserRole;
    projectId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    projectId?: string;
    /**
     * Epoch milliseconds (`Date.now()`), stamped once at sign-in
     * (`callbacks.jwt` only receives `user` then) and never touched again.
     * Milliseconds, not the Unix-seconds `iat` uses — `src/lib/session-
     * revocation.ts` compares this against a floor recorded at millisecond
     * precision, so mixing units here would make every token look far older
     * than any floor. Unlike `iat`, which `jwt.encode` overwrites with `now`
     * on every session read, this survives re-encode — see
     * `src/auth.config.ts`'s `session` callback for why revocation must
     * compare against this instead of `iat`.
     */
    authTime?: number;
  }
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  projectId?: string;
}
