import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '../../../libs/prisma'
import { 
  verifyPassword, 
  generateAccessToken, 
  generateRefreshToken, 
  generateRefreshTokenId,
  getExpiryDate,
  sanitizeInput,
  RateLimiter
} from '../../../lib/auth'

// Login schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false)
})

// Rate limiter instance
const rateLimiter = new RateLimiter()

export async function POST(request: NextRequest) {
  try {
    console.log('Login request received')
    const body = await request.json()
    console.log('Request body:', { ...body, password: '[REDACTED]' })
    
    // Validate input
    const validationResult = loginSchema.safeParse(body)
    if (!validationResult.success) {
      console.log('Validation failed:', validationResult.error.errors)
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { email, password, rememberMe } = validationResult.data
    const sanitizedEmail = email.toLowerCase().trim()

    // Check rate limiting
    if (rateLimiter.isBlocked(sanitizedEmail)) {
      console.log('Rate limit exceeded for:', sanitizedEmail)
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
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
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if email is verified
    if (!user.emailVerified) {
      console.log('Email not verified for:', sanitizedEmail)
      return NextResponse.json(
        { error: 'Please verify your email address before logging in' },
        { status: 403 }
      )
    }

    console.log('Verifying password...')
    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password)
    
    if (!isPasswordValid) {
      console.log('Invalid password for:', sanitizedEmail)
      rateLimiter.recordAttempt(sanitizedEmail)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Clear rate limiting on successful login
    rateLimiter.clearAttempts(sanitizedEmail)

    console.log('Generating tokens...')
    // Generate refresh token ID
    const refreshTokenId = generateRefreshTokenId()
    
    // Calculate expiry based on remember me
    const refreshTokenExpiry = rememberMe ? 30 : 7 // 30 days vs 7 days
    
    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshTokenId,
        expiresAt: getExpiryDate(refreshTokenExpiry * 24) // Convert days to hours
      }
    })

    // Generate JWT tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    })

    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenId: refreshTokenId
    })

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    console.log('Login successful for:', user.email)

    // Create response with user info
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified
      }
    })

    // Set HTTP-only cookies
    const isProduction = process.env.NODE_ENV === 'production'
    
    console.log('🍪 Setting cookies for user:', user.email);
    console.log('🍪 Access token length:', accessToken.length);
    console.log('🍪 Refresh token length:', refreshToken.length);
    
    // Access token cookie (15 minutes)
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/'
    })

    // Refresh token cookie (7 or 30 days based on remember me)
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: refreshTokenExpiry * 24 * 60 * 60, // Convert days to seconds
      path: '/'
    })

    console.log('🍪 Cookies set successfully');
    console.log('🍪 Response headers:', response.headers);

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 