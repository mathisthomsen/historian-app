import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  // Only allow this in development/test environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Update user to verified
    const user = await prisma.user.update({
      where: { email: email.toLowerCase().trim() },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date()
      }
    });

    // Delete any existing email confirmation tokens for this user
    await prisma.emailConfirmation.deleteMany({
      where: { userId: user.id }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'User email verified for testing',
      userId: user.id 
    });

  } catch (error) {
    console.error('Error verifying test user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 