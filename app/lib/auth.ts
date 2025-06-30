import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { NextRequest } from 'next/server'
import prisma from '../libs/prisma'

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production'
const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '7d'

// Email Configuration
const EMAIL_CONFIRMATION_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours
const PASSWORD_RESET_EXPIRY = 60 * 60 * 1000 // 1 hour

export interface JWTPayload {
  userId: number
  email: string
  role: string
  iat?: number
  exp?: number
}

export interface RefreshTokenPayload {
  userId: number
  tokenId: string
  iat?: number
  exp?: number
}

// Get current user from request
export const getCurrentUser = async (req?: NextRequest): Promise<any> => {
  try {
    let token: string | undefined;

    if (req) {
      console.log('🔍 getCurrentUser: Checking request for authentication');
      
      // First try Authorization header
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log('🔍 getCurrentUser: Found token in Authorization header');
      } else {
        // Then try cookies
        const cookies = req.cookies;
        console.log('🔍 getCurrentUser: Available cookies:', Array.from(cookies.getAll()));
        
        const accessTokenCookie = cookies.get('accessToken');
        console.log('🔍 getCurrentUser: accessToken cookie:', accessTokenCookie);
        
        token = accessTokenCookie?.value;
        if (token) {
          console.log('🔍 getCurrentUser: Found token in cookies');
        } else {
          console.log('🔍 getCurrentUser: No token found in cookies');
        }
      }
    } else {
      // For client-side, try to get from cookies
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken='));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }
    }

    if (!token) {
      console.log('🔍 getCurrentUser: No token found, returning null');
      return null;
    }

    console.log('🔍 getCurrentUser: Verifying token...');
    const payload = verifyAccessToken(token);
    if (!payload) {
      console.log('🔍 getCurrentUser: Token verification failed');
      return null;
    }

    console.log('🔍 getCurrentUser: Token verified, payload:', payload);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
      }
    });

    console.log('🔍 getCurrentUser: User found:', user);
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

// Password utilities
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

// Password validation
export const validatePasswordStrength = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// JWT utilities
export const generateAccessToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY })
}

export const generateRefreshToken = (payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY })
}

export const verifyAccessToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export const verifyRefreshToken = (token: string): RefreshTokenPayload | null => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload
  } catch {
    return null
  }
}

// Token generation utilities
export const generateEmailConfirmationToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

export const generatePasswordResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

export const generateRefreshTokenId = (): string => {
  return crypto.randomBytes(16).toString('hex')
}

// Date utilities
export const getExpiryDate = (hours: number): Date => {
  return new Date(Date.now() + hours * 60 * 60 * 1000)
}

export const isTokenExpired = (expiryDate: Date): boolean => {
  return new Date() > expiryDate
}

// Rate limiting utilities
export class RateLimiter {
  private attempts = new Map<string, { count: number; lastAttempt: number }>()
  private readonly maxAttempts = 5
  private readonly timeWindow = 15 * 60 * 1000 // 15 minutes

  isBlocked(identifier: string): boolean {
    const userAttempts = this.attempts.get(identifier)
    if (!userAttempts) return false

    const now = Date.now()
    if (now - userAttempts.lastAttempt > this.timeWindow) {
      this.attempts.delete(identifier)
      return false
    }

    return userAttempts.count >= this.maxAttempts
  }

  recordAttempt(identifier: string): void {
    const userAttempts = this.attempts.get(identifier) || { count: 0, lastAttempt: 0 }
    userAttempts.count += 1
    userAttempts.lastAttempt = Date.now()
    this.attempts.set(identifier, userAttempts)
  }

  clearAttempts(identifier: string): void {
    this.attempts.delete(identifier)
  }
}

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 1000) // Limit length
}

// Common password check
export const isCommonPassword = (password: string): boolean => {
  const commonPasswords = [
    'password', '123456', 'qwerty', 'admin', 'letmein',
    'welcome', 'monkey', 'dragon', 'master', 'football',
    'baseball', 'whatever', 'trustno1', 'butterfly', 'dragon'
  ]
  return commonPasswords.includes(password.toLowerCase())
} 