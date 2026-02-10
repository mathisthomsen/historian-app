import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { RateLimiter } from '../../../lib/utils/validation';

const prisma = new PrismaClient();
const rateLimiter = new RateLimiter(60000, 10); // 10 requests per minute per IP

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    console.log('Verification request:', { token: token?.substring(0, 10) + '...', email });

    if (!token || !email) {
      console.log('Missing token or email');
      return NextResponse.json(
        { error: 'Missing verification token or email' },
        { status: 400 }
      );
    }

    // Find the email confirmation
    const emailConfirmation = await prisma.emailConfirmation.findUnique({
      where: { token },
      include: { user: true },
    });

    console.log('Email confirmation found:', !!emailConfirmation);

    if (!emailConfirmation) {
      console.log('Invalid token - no confirmation found');
      
      // Check if the user is already verified
      const user = await prisma.user.findUnique({
        where: { email },
      });
      
      if (user && user.emailVerified) {
        console.log('User is already verified');
        return NextResponse.json(
          { 
            message: 'Email is already verified',
            user: {
              id: user.id,
              email: user.email,
              emailVerified: true,
            }
          },
          { status: 200 }
        );
      }
      
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (emailConfirmation.expiresAt < new Date()) {
      console.log('Token expired');
      return NextResponse.json(
        { error: 'Verification token has expired' },
        { status: 400 }
      );
    }

    // Check if email matches
    if (emailConfirmation.user.email !== email) {
      console.log('Email mismatch:', { expected: emailConfirmation.user.email, received: email });
      return NextResponse.json(
        { error: 'Email does not match verification token' },
        { status: 400 }
      );
    }

    console.log('All checks passed, updating user verification status');

    // Update user email verification status
    await prisma.user.update({
      where: { id: emailConfirmation.userId },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // Delete the used confirmation token
    await prisma.emailConfirmation.delete({
      where: { id: emailConfirmation.id },
    });

    // Log the verification
    await prisma.authAuditLog.create({
      data: {
        userId: emailConfirmation.userId,
        eventType: 'EMAIL_VERIFIED',
        details: {
          email: emailConfirmation.user.email,
          verifiedAt: new Date(),
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    console.log('Verification completed successfully');

    return NextResponse.json(
      { 
        message: 'Email verified successfully',
        user: {
          id: emailConfirmation.user.id,
          email: emailConfirmation.user.email,
          emailVerified: true,
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Email verification error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
} 