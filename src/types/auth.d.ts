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
     * Unix seconds, stamped once at sign-in (`callbacks.jwt` only receives
     * `user` then) and never touched again. Unlike `iat`, which `jwt.encode`
     * overwrites with `now` on every session read, this survives re-encode —
     * see `src/auth.config.ts`'s `session` callback for why revocation must
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
