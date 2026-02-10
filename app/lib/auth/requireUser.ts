import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth';

export async function requireUser() {
  const session = await getServerSession(authOptions as any);
  if (!session) {
    throw new Error('Not authenticated');
  }
  return (session as any).user;
}

export async function getOrCreateLocalUser(user: any) {
  // For NextAuth, we can use the user directly from the session
  // This function is kept for compatibility with existing API routes
  return user;
} 