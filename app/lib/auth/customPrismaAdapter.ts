import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '../database/prisma';

export function CustomPrismaAdapter() {
  const adapter = PrismaAdapter(prisma);

  return {
    ...adapter,
    async getUser(id: string) {
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return null;
      return {
        ...user,
        emailVerified: user.emailVerifiedAt,
      };
    },
    async getUserByEmail(email: string) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return null;
      return {
        ...user,
        emailVerified: user.emailVerifiedAt,
      };
    },
    async updateUser(user: any) {
      const { emailVerified, ...rest } = user;
      // Map emailVerified to emailVerifiedAt
      if (typeof adapter.updateUser === 'function') {
        return adapter.updateUser({
          ...rest,
          emailVerifiedAt: emailVerified,
        });
      }
      // fallback: return user as-is
      return { ...user, emailVerified: emailVerified };
    },
  };
}
