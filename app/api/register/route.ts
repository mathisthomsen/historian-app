import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/database/prisma';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { validateName, validateEmail, validatePassword, RateLimiter } from '@/app/lib/utils/validation';
import { sendVerificationEmail } from '@/app/lib/services/email';

const rateLimiter = new RateLimiter(60000, 5); // 5 registrations per minute per IP

export async function POST(request: NextRequest) {
  try {
    const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!rateLimiter.isAllowed(clientIP)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }
    const body = await request.json();
    const { name, email, password } = body;

    // Validate input
    const nameError = validateName(name);
    if (nameError) {
      return NextResponse.json({ error: nameError }, { status: 400 });
    }
    const emailError = validateEmail(email);
    if (emailError) {
      return NextResponse.json({ error: emailError }, { status: 400 });
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    // Check for existing user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 });
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

    // Create project
    const project = await prisma.project.create({
      data: {
        name: 'Default Project',
        owner_id: user.id,
        updated_at: new Date(),
      },
    });

    // Add user to project
    await prisma.userProject.create({
      data: {
        user_id: user.id,
        project_id: project.id,
        role: 'owner'
      },
    });

    // Ensure userId is a string
    const userId = typeof user.id === 'string' ? user.id : String(user.id);

    // Create email confirmation token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await prisma.emailConfirmation.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    // Send verification email
    await sendVerificationEmail(email, token);

    return NextResponse.json({ message: 'Registration successful! Please check your email for a verification link to complete your account setup.' }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error. Please try again later.' }, { status: 500 });
  }
} 