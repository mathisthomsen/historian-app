/**
 * Registration API Integration Tests
 * 
 * Tests the actual registration API endpoints with real database operations
 */

import { NextRequest } from 'next/server'
import { POST } from '../../app/api/register/route'

// Mock NextRequest
const createMockRequest = (body: any): NextRequest => {
  return {
    json: jest.fn().mockResolvedValue(body),
    headers: {
      get: jest.fn().mockReturnValue('test-user-agent')
    }
  } as any
}

describe('Registration API Integration Tests', () => {
  beforeEach(() => {
    // Clear any test data
    jest.clearAllMocks()
  })

  describe('POST /api/register', () => {
    test('should validate required fields', async () => {
      const request = createMockRequest({})
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Name, email, and password are required')
    })

    test('should validate email format', async () => {
      const request = createMockRequest({
        name: 'Test User',
        email: 'invalid-email',
        password: 'SecurePass123!'
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid email format')
    })

    test('should validate password strength', async () => {
      const request = createMockRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'weak'
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Password validation failed')
      expect(data.details).toContain('Password must be at least 8 characters long')
      expect(data.details).toContain('Password must contain at least one uppercase letter')
      expect(data.details).toContain('Password must contain at least one number')
      expect(data.details).toContain('Password must contain at least one special character')
    })

    test('should reject common passwords', async () => {
      const request = createMockRequest({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Password validation failed')
      expect(data.details).toContain('Password is too common')
    })

    test('should create user successfully with valid data', async () => {
      const uniqueEmail = `test-${Date.now()}@example.com`
      const request = createMockRequest({
        name: 'Test User',
        email: uniqueEmail,
        password: 'SecurePass123!'
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('User created successfully')
      expect(data.user).toHaveProperty('id')
      expect(data.user.name).toBe('Test User')
      expect(data.user.email).toBe(uniqueEmail)
      expect(data.user.role).toBe('USER')
    })

    test('should reject duplicate email', async () => {
      const uniqueEmail = `test-${Date.now()}@example.com`
      
      // First registration
      const request1 = createMockRequest({
        name: 'Test User',
        email: uniqueEmail,
        password: 'SecurePass123!'
      })
      await POST(request1)

      // Second registration with same email
      const request2 = createMockRequest({
        name: 'Another User',
        email: uniqueEmail,
        password: 'SecurePass123!'
      })
      const response = await POST(request2)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toBe('User with this email already exists')
    })
  })

  describe('Password Security Tests', () => {
    test('should accept strong passwords', async () => {
      const strongPasswords = [
        'SecurePass123!',
        'MyP@ssw0rd',
        'Str0ng#P@ss',
        'C0mpl3x!P@ss'
      ]

      for (const password of strongPasswords) {
        const uniqueEmail = `test-${Date.now()}-${Math.random()}@example.com`
        const request = createMockRequest({
          name: 'Test User',
          email: uniqueEmail,
          password
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.message).toBe('User created successfully')
      }
    })

    test('should reject weak passwords', async () => {
      const weakPasswords = [
        'password', // too short, no complexity
        '12345678', // only numbers
        'abcdefgh', // only lowercase
        'ABCDEFGH', // only uppercase
        'pass123', // too short
        'password123', // common password
        'admin', // common password
        'qwerty' // common password
      ]

      for (const password of weakPasswords) {
        const request = createMockRequest({
          name: 'Test User',
          email: `test-${Date.now()}-${Math.random()}@example.com`,
          password
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Password validation failed')
      }
    })
  })

  describe('Input Validation Tests', () => {
    test('should handle missing fields', async () => {
      const testCases = [
        { name: 'Test User', email: 'test@example.com' }, // missing password
        { email: 'test@example.com', password: 'SecurePass123!' }, // missing name
        { name: 'Test User', password: 'SecurePass123!' }, // missing email
        {} // all missing
      ]

      for (const testCase of testCases) {
        const request = createMockRequest(testCase)
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Name, email, and password are required')
      }
    })

    test('should validate email formats', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user@.com',
        'user..name@example.com',
        'user@example..com'
      ]

      for (const email of invalidEmails) {
        const request = createMockRequest({
          name: 'Test User',
          email,
          password: 'SecurePass123!'
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Invalid email format')
      }
    })

    test('should accept valid email formats', async () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com'
      ]

      for (const email of validEmails) {
        const request = createMockRequest({
          name: 'Test User',
          email,
          password: 'SecurePass123!'
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.message).toBe('User created successfully')
      }
    })
  })
}) 