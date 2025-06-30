import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '../../../libs/prisma'
import { 
  hashPassword, 
  validatePasswordStrength,
  isCommonPassword,
  sanitizeInput,
  RateLimiter
} from '../../../lib/auth'

// Reset password schema
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
})

// Rate limiter instance
const rateLimiter = new RateLimiter()

export async function POST(request: NextRequest) {
  try {
    console.log('Reset password request received')
    const body = await request.json()
    console.log('Request body:', { ...body, password: '[REDACTED]' })

    // Validate input
    const validationResult = resetPasswordSchema.safeParse(body)
    if (!validationResult.success) {
      console.log('Validation failed:', validationResult.error.errors)
      return NextResponse.json(
        { error: 'Invalid input data' },
        { status: 400 }
      )
    }

    const { token, password } = validationResult.data
    const sanitizedToken = sanitizeInput(token)

    // Check rate limiting
    if (rateLimiter.isBlocked(sanitizedToken)) {
      console.log('Rate limit exceeded for token')
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    console.log('Looking up password reset token...')
    // Find password reset record
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token: sanitizedToken },
      include: { user: true }
    })

    if (!resetRecord) {
      console.log('Invalid reset token')
      rateLimiter.recordAttempt(sanitizedToken)
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (new Date() > resetRecord.expiresAt) {
      console.log('Reset token expired')
      await prisma.passwordReset.delete({
        where: { id: resetRecord.id }
      })
      return NextResponse.json(
        { error: 'Reset token has expired' },
        { status: 400 }
      )
    }

    // Check if token has already been used
    if (resetRecord.used) {
      console.log('Reset token already used')
      return NextResponse.json(
        { error: 'Reset token has already been used' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      console.log('Password validation failed:', passwordValidation.errors)
      return NextResponse.json(
        { error: 'Password does not meet requirements', details: passwordValidation.errors },
        { status: 400 }
      )
    }

    // Check for common passwords
    if (isCommonPassword(password)) {
      console.log('Common password detected')
      return NextResponse.json(
        { error: 'Password is too common. Please choose a more unique password.' },
        { status: 400 }
      )
    }

    console.log('Hashing new password...')
    // Hash the new password
    const hashedPassword = await hashPassword(password)

    console.log('Updating user password...')
    // Update user password
    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      }
    })

    // Mark reset token as used
    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true }
    })

    // Delete all refresh tokens for this user (force re-login)
    await prisma.refreshToken.deleteMany({
      where: { userId: resetRecord.userId }
    })

    console.log('Password reset successful for user:', resetRecord.user.email)
    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'An error occurred while resetting your password' },
      { status: 500 }
    )
  }
} 