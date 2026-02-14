import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/database/prisma';
import { requireUser } from '@/app/lib/auth/requireUser';

/**
 * Returns the current session user's verification status.
 * Requires authentication; no user enumeration (no email in body).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        emailVerifiedAt: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: dbUser.id,
      email: dbUser.email,
      emailVerified: dbUser.emailVerified,
      emailVerifiedAt: dbUser.emailVerifiedAt,
    });
  } catch {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
