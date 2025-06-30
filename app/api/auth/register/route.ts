import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { 
  hashPassword, 
  validateEmail, 
  validatePasswordStrength, 
  isCommonPassword,
  generateEmailConfirmationToken,
  getExpiryDate,
  sanitizeInput
} from '../../../lib/auth'
import { emailService } from '../../../lib/email'

const prisma = new PrismaClient()

// Registration schema
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

export async function POST(request: NextRequest) {
  try {
    console.log('Registration request received')
    const body = await request.json()
    console.log('Request body:', { ...body, password: '[REDACTED]' })
    
    // Validate input
    const validationResult = registerSchema.safeParse(body)
    if (!validationResult.success) {
      console.log('Validation failed:', validationResult.error.errors)
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { name, email, password } = validationResult.data
    console.log('Validation passed for:', { name, email })

    // Sanitize inputs
    const sanitizedName = sanitizeInput(name)
    const sanitizedEmail = email.toLowerCase().trim()

    // Additional validations
    if (!validateEmail(sanitizedEmail)) {
      console.log('Email validation failed:', sanitizedEmail)
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      console.log('Password validation failed:', passwordValidation.errors)
      return NextResponse.json(
        { error: 'Password does not meet requirements', details: passwordValidation.errors },
        { status: 400 }
      )
    }

    if (isCommonPassword(password)) {
      console.log('Common password detected')
      return NextResponse.json(
        { error: 'Password is too common. Please choose a more secure password' },
        { status: 400 }
      )
    }

    console.log('Checking for existing user...')
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail }
    })

    if (existingUser) {
      console.log('User already exists:', sanitizedEmail)
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    console.log('Hashing password...')
    // Hash password
    const hashedPassword = await hashPassword(password)

    console.log('Creating user...')
    // Create user (initially unverified)
    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        name: sanitizedName,
        password: hashedPassword,
        emailVerified: false
      }
    })

    console.log('User created:', { id: user.id, email: user.email })

    // Generate email confirmation token
    const confirmationToken = generateEmailConfirmationToken()
    const expiresAt = getExpiryDate(24) // 24 hours

    console.log('Creating email confirmation...')
    // Store confirmation token
    await prisma.emailConfirmation.create({
      data: {
        userId: user.id,
        token: confirmationToken,
        expiresAt
      }
    })

    console.log('Sending confirmation email...')
    // Send confirmation email
    const emailSent = await emailService.sendEmailConfirmation(
      user.email,
      user.name,
      confirmationToken
    )

    if (!emailSent) {
      // If email fails, we should still create the user but log the error
      console.error('Failed to send confirmation email to:', user.email)
    }

    console.log('Registration successful for:', user.email)
    // Return success response (don't include sensitive data)
    return NextResponse.json(
      { 
        message: 'Registration successful. Please check your email to confirm your account.',
        userId: user.id
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Registration error:', error)
    
    // Check if it's a Prisma error
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any
      if (prismaError.code === 'P2002') {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 