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
  }
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  projectId?: string;
}
