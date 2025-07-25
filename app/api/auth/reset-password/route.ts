import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/libs/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const { email, token, password } = await request.json();
  if (!email || !token || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: 'Invalid token or user' }, { status: 400 });
  }
  const reset = await prisma.passwordReset.findFirst({ where: { userId: user.id, token, used: false, expiresAt: { gt: new Date() } } });
  if (!reset) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  }
  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
  await prisma.passwordReset.update({ where: { id: reset.id }, data: { used: true } });
  return NextResponse.json({ success: true });
} 