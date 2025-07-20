import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendVerificationEmail } from '../../../lib/email';
import { RateLimiter } from '../../../lib/validation';
import crypto from 'crypto';

const prisma = new PrismaClient();
const rateLimiter = new RateLimiter(60000, 5); // 5 requests per minute per IP

export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    // Check rate limiting
    if (!rateLimiter.isAllowed(clientIP)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Delete any existing verification tokens for this user
    await prisma.emailConfirmation.deleteMany({
      where: { userId: user.id },
    });

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new email confirmation
    await prisma.emailConfirmation.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt: verificationExpires,
      },
    });

    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationToken);
    
    console.log('Email send result:', emailSent);
    
    if (!emailSent) {
      console.warn('Failed to send verification email to:', email);
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again later.' },
        { status: 500 }
      );
    }

    // Log the resend verification event
    await prisma.authAuditLog.create({
      data: {
        userId: user.id,
        eventType: 'VERIFICATION_EMAIL_RESENT',
        details: {
          email: user.email,
          emailSent,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(
      { 
        message: 'Verification email sent successfully',
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Resend verification error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
} 