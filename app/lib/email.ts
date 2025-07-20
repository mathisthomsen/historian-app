import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export const createVerificationEmail = (email: string, token: string): EmailTemplate => {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;
  
  return {
    subject: 'Verify your email address - Historian App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Welcome to Historian App!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Please verify your email address to complete your registration.</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
          <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">
            Hi there! Thanks for signing up for Historian App. To complete your registration, please click the button below to verify your email address:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: #1976d2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="margin: 20px 0 0 0; color: #666; font-size: 14px;">
            If the button doesn't work, you can copy and paste this link into your browser:
          </p>
          <p style="margin: 10px 0 0 0; color: #1976d2; font-size: 14px; word-break: break-all;">
            ${verificationUrl}
          </p>
          
          <p style="margin: 30px 0 0 0; color: #666; font-size: 14px;">
            This link will expire in 24 hours. If you didn't create an account with Historian App, you can safely ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>© 2024 Historian App. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `
Welcome to Historian App!

Please verify your email address to complete your registration.

Click this link to verify your email: ${verificationUrl}

This link will expire in 24 hours. If you didn't create an account with Historian App, you can safely ignore this email.

© 2024 Historian App. All rights reserved.
    `,
  };
};

export const createPasswordResetEmail = (email: string, token: string): EmailTemplate => {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  
  return {
    subject: 'Reset your password - Historian App',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc004e 0%, #ff5983 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Password Reset Request</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">We received a request to reset your password.</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-top: 20px;">
          <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">
            Hi there! We received a request to reset your password for your Historian App account. Click the button below to create a new password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #dc004e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="margin: 20px 0 0 0; color: #666; font-size: 14px;">
            If the button doesn't work, you can copy and paste this link into your browser:
          </p>
          <p style="margin: 10px 0 0 0; color: #dc004e; font-size: 14px; word-break: break-all;">
            ${resetUrl}
          </p>
          
          <p style="margin: 30px 0 0 0; color: #666; font-size: 14px;">
            This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
          <p>© 2024 Historian App. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `
Password Reset Request

We received a request to reset your password for your Historian App account.

Click this link to reset your password: ${resetUrl}

This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.

© 2024 Historian App. All rights reserved.
    `,
  };
};

export const sendEmail = async (to: string, template: EmailTemplate): Promise<boolean> => {
  try {
    console.log('Attempting to send email to:', to);
    console.log('Using API key:', process.env.RESEND_API_KEY ? 'Present' : 'Missing');
    console.log('Using from address:', process.env.EMAIL_FROM);
    
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@historianapp.com',
      to: [to],
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
    
    if (error) {
      console.error('Resend API error:', error);
      return false;
    }
    
    console.log('Email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

export const sendVerificationEmail = async (email: string, token: string): Promise<boolean> => {
  const template = createVerificationEmail(email, token);
  return sendEmail(email, template);
};

export const sendPasswordResetEmail = async (email: string, token: string): Promise<boolean> => {
  const template = createPasswordResetEmail(email, token);
  return sendEmail(email, template);
}; 