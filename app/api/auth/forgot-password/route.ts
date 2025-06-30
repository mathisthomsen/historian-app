import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '../../../libs/prisma'
import { 
  generatePasswordResetToken, 
  getExpiryDate, 
  sanitizeInput,
  RateLimiter
} from '../../../lib/auth'
import { sendPasswordResetEmail } from '../../../lib/email'

// Forgot password schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
})

// Rate limiter instance
const rateLimiter = new RateLimiter()

export async function POST(request: NextRequest) {
  try {
    console.log('Forgot password request received')
    const body = await request.json()
    console.log('Request body:', { ...body, email: body.email ? '[REDACTED]' : undefined })

    // Validate input
    const validationResult = forgotPasswordSchema.safeParse(body)
    if (!validationResult.success) {
      console.log('Validation failed:', validationResult.error.errors)
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const { email } = validationResult.data
    const sanitizedEmail = sanitizeInput(email.toLowerCase())

    // Check rate limiting
    if (rateLimiter.isBlocked(sanitizedEmail)) {
      console.log('Rate limit exceeded for:', sanitizedEmail)
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    console.log('Looking up user...')
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    })

    if (!user) {
      console.log('User not found:', sanitizedEmail)
      rateLimiter.recordAttempt(sanitizedEmail)
      // Don't reveal if user exists or not for security
      return NextResponse.json(
        { success: true, message: 'If an account with this email exists, a password reset link has been sent.' }
      )
    }

    // Check if email is verified
    if (!user.emailVerified) {
      console.log('Email not verified for:', sanitizedEmail)
      rateLimiter.recordAttempt(sanitizedEmail)
      return NextResponse.json(
        { error: 'Please verify your email address before requesting a password reset' },
        { status: 403 }
      )
    }

    console.log('Generating password reset token...')
    // Generate password reset token
    const resetToken = generatePasswordResetToken()
    const expiresAt = getExpiryDate(1) // 1 hour expiry

    // Delete any existing reset tokens for this user
    await prisma.passwordReset.deleteMany({
      where: { userId: user.id }
    })

    // Create new password reset record
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt: expiresAt
      }
    })

    console.log('Sending password reset email...')
    // Send password reset email
    await sendPasswordResetEmail(user.email, resetToken)

    console.log('Password reset email sent successfully for:', sanitizedEmail)
    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
} 