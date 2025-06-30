import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { isTokenExpired } from '../../../lib/auth'
import { emailService } from '../../../lib/email'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Missing confirmation token' },
        { status: 400 }
      )
    }

    console.log('Email confirmation request for token:', token)

    // Find the email confirmation
    const emailConfirmation = await prisma.emailConfirmation.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!emailConfirmation) {
      console.log('Invalid confirmation token:', token)
      return NextResponse.json(
        { error: 'Invalid confirmation token' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (isTokenExpired(emailConfirmation.expiresAt)) {
      console.log('Expired confirmation token:', token)
      
      // Delete expired token
      await prisma.emailConfirmation.delete({
        where: { id: emailConfirmation.id }
      })

      return NextResponse.json(
        { error: 'Confirmation token has expired' },
        { status: 400 }
      )
    }

    // Check if user is already verified
    if (emailConfirmation.user.emailVerified) {
      console.log('User already verified:', emailConfirmation.user.email)
      return NextResponse.json(
        { error: 'Email is already confirmed' },
        { status: 400 }
      )
    }

    // Update user to verified
    await prisma.user.update({
      where: { id: emailConfirmation.user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date()
      }
    })

    // Delete the confirmation token
    await prisma.emailConfirmation.delete({
      where: { id: emailConfirmation.id }
    })

    // Send welcome email
    await emailService.sendWelcomeEmail(
      emailConfirmation.user.email,
      emailConfirmation.user.name
    )

    console.log('Email confirmed successfully for:', emailConfirmation.user.email)

    // Get the current port from environment or default to 3000
    const port = process.env.PORT || '3000'
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`
    
    // Redirect to login page with success message
    const loginUrl = `${baseUrl}/auth/login?confirmed=true`
    
    return NextResponse.redirect(loginUrl)

  } catch (error) {
    console.error('Email confirmation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 