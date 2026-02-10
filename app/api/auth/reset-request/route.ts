import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/database/prisma';
import crypto from 'crypto';
import { sendPasswordResetEmail } from '@/app/lib/services/email';

export async function POST(request: NextRequest) {
  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }
  // Always respond with success for security
  let user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await prisma.passwordReset.create({
      data: { userId: user.id, token, expiresAt: expires, used: false },
    });
    await sendPasswordResetEmail(email, token);
  }
  return NextResponse.json({ success: true });
} 