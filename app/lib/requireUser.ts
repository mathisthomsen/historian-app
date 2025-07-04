import { withAuth } from '@workos-inc/authkit-nextjs';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function requireUser() {
  const { user } = await withAuth({ ensureSignedIn: true });
  if (!user) {
    throw new Error('Not authenticated');
  }
  return user;
}

export async function getOrCreateLocalUser(workosUser: any) {
  let localUser = await prisma.user.findUnique({
    where: { workosUserId: workosUser.id }
  });
  if (!localUser) {
    localUser = await prisma.user.create({
      data: {
        workosUserId: workosUser.id,
        email: workosUser.email,
        name: workosUser.firstName || workosUser.email || 'Unknown',
        password: '', // or null if allowed
        role: 'USER', // or your default
      }
    });
  }
  return localUser;
} 