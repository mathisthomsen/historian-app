import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { sendVerificationEmail } from '../../lib/email';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Validation schema
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter' },
        { status: 400 }
      );
    }

    if (!/[a-z]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one lowercase letter' },
        { status: 400 }
      );
    }

    if (!/\d/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one number' },
        { status: 400 }
      );
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one special character' },
        { status: 400 }
      );
    }

    // Check for common passwords
    const commonPasswords = [
      'password', '123456', '12345678', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      return NextResponse.json(
        { error: 'Password is too common. Please choose a stronger password' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: false,
      },
    });

    // Generate verification token and create email confirmation
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.emailConfirmation.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt: verificationExpires,
      },
    });

    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationToken);
    
    if (!emailSent) {
      console.warn('Failed to send verification email to:', email);
      // Don't fail registration if email fails, but log it
    }

    // Log the registration
    await prisma.authAuditLog.create({
      data: {
        userId: user.id,
        eventType: 'USER_REGISTERED',
        details: {
          email: user.email,
          name: user.name,
          emailVerified: false,
          emailSent,
        },
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(
      { 
        message: 'User registered successfully. Please check your email to verify your account.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    
    // Log the error
    try {
      await prisma.authAuditLog.create({
        data: {
          eventType: 'REGISTRATION_ERROR',
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
          },
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError);
    }

    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
} 