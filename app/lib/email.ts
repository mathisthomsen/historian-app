import nodemailer from 'nodemailer'

// Mock email service - replace with real provider in production
export class EmailService {
  private transporter: nodemailer.Transporter

  constructor() {
    // For development, use a mock transporter that doesn't actually send emails
    this.transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      secure: false,
      auth: {
        user: 'test',
        pass: 'test'
      },
      // Add timeout and ignore TLS errors for development
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000,
      ignoreTLS: true,
      requireTLS: false
    })

    // In production, you would use something like:
    // this.transporter = nodemailer.createTransport({
    //   service: 'gmail',
    //   auth: {
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_PASS
    //   }
    // })
  }

  async sendEmailConfirmation(email: string, name: string, token: string): Promise<boolean> {
    // Get the current port from environment or default to 3000
    const port = process.env.PORT || '3000'
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`
    const confirmationUrl = `${baseUrl}/auth/confirm-email?token=${token}`
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@historianapp.com',
      to: email,
      subject: 'Confirm your email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Historian App!</h2>
          <p>Hi ${name},</p>
          <p>Thank you for registering with Historian App. Please confirm your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" 
               style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Confirm Email Address
            </a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${confirmationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account with Historian App, you can safely ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from Historian App. Please do not reply to this email.
          </p>
        </div>
      `
    }

    return this.sendEmail(mailOptions)
  }

  async sendPasswordReset(email: string, name: string, token: string): Promise<boolean> {
    // Get the current port from environment or default to 3000
    const port = process.env.PORT || '3000'
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@historianapp.com',
      to: email,
      subject: 'Reset your password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hi ${name},</p>
          <p>You requested to reset your password for your Historian App account. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from Historian App. Please do not reply to this email.
          </p>
        </div>
      `
    }

    return this.sendEmail(mailOptions)
  }

  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    // Get the current port from environment or default to 3000
    const port = process.env.PORT || '3000'
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${port}`
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@historianapp.com',
      to: email,
      subject: 'Welcome to Historian App!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Historian App!</h2>
          <p>Hi ${name},</p>
          <p>Your email has been confirmed and your account is now active!</p>
          <p>You can now:</p>
          <ul>
            <li>Create and manage historical persons</li>
            <li>Document historical events</li>
            <li>Map historical locations</li>
            <li>Catalog literature and sources</li>
            <li>Analyze your research data</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}/dashboard" 
               style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          <p>Happy researching!</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This is an automated message from Historian App. Please do not reply to this email.
          </p>
        </div>
      `
    }

    return this.sendEmail(mailOptions)
  }

  private async sendEmail(mailOptions: nodemailer.SendMailOptions): Promise<boolean> {
    try {
      // For development, just log the email instead of actually sending
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 EMAIL (Development Mode):')
        console.log('To:', mailOptions.to)
        console.log('Subject:', mailOptions.subject)
        if (mailOptions.html && typeof mailOptions.html === 'string') {
          // Extract URL from HTML content
          const urlMatch = mailOptions.html.match(/href="([^"]+)"/)
          if (urlMatch) {
            console.log('URL:', urlMatch[1])
          }
        }
        console.log('---')
        return true
      }

      await this.transporter.sendMail(mailOptions)
      console.log(`Email sent to ${mailOptions.to}`)
      return true
    } catch (error) {
      console.error('Failed to send email:', error)
      // In development, don't fail if email fails
      if (process.env.NODE_ENV === 'development') {
        console.log('Email service failed, but continuing (development mode)')
        return true
      }
      return false
    }
  }
}

// Export singleton instance
export const emailService = new EmailService()

// Convenience functions for direct use
export const sendEmailConfirmation = async (email: string, name: string, token: string): Promise<boolean> => {
  return emailService.sendEmailConfirmation(email, name, token)
}

export const sendPasswordResetEmail = async (email: string, token: string): Promise<boolean> => {
  // Get user name from email (for now, just use email prefix)
  const name = email.split('@')[0]
  return emailService.sendPasswordReset(email, name, token)
}

export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
  return emailService.sendWelcomeEmail(email, name)
} 