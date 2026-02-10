import { z } from 'zod';

// Person validation schema
export const personSchema = z.object({
  first_name: z.string().min(1, 'Vorname ist erforderlich').max(100, 'Vorname zu lang'),
  last_name: z.string().min(1, 'Nachname ist erforderlich').max(100, 'Nachname zu lang'),
  birth_date: z.string().optional(),
  birth_place: z.string().max(255, 'Geburtsort zu lang').optional(),
  death_date: z.string().optional(),
  death_place: z.string().max(255, 'Sterbeort zu lang').optional(),
  notes: z.string().max(10000, 'Notizen zu lang').optional(),
});

// Event validation schema
export const eventSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').max(255, 'Titel zu lang'),
  description: z.string().max(10000, 'Beschreibung zu lang').optional(),
  date: z.string().optional(),
  end_date: z.string().optional(),
  location: z.string().max(255, 'Ort zu lang').optional(),
});

// Life event validation schema
export const lifeEventSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').max(255, 'Titel zu lang'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  location: z.string().max(255, 'Ort zu lang').optional(),
  description: z.string().max(10000, 'Beschreibung zu lang').optional(),
  event_id: z.string().optional(),
  person_id: z.number().positive('Person ID muss positiv sein'),
});

// Sanitize HTML content
export function sanitizeHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

// Validate and sanitize input
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const result = schema.parse(data);
    
    // Sanitize string fields
    const sanitized = { ...result };
    for (const key of Object.keys(sanitized as object) as Array<keyof typeof sanitized>) {
      const value = sanitized[key];
      if (typeof value === 'string') {
        // Only assign if the field is actually a string
        (sanitized as any)[key] = sanitizeHtml(value);
      }
    }

    return { success: true, data: sanitized };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => err.message)
      };
    }
    return {
      success: false,
      errors: ['Ungültige Eingabe']
    };
  }
}

// Rate limiting helper
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, [now]);
      return true;
    }

    const requests = this.requests.get(identifier)!;
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    return true;
  }

  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [identifier, requests] of Array.from(this.requests.entries())) {
      const recentRequests = requests.filter(time => time > windowStart);
      if (recentRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recentRequests);
      }
    }
  }
} 

// Validation utilities for forms

export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required';
  
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  
  if (!/\d/.test(password)) {
    return 'Password must contain at least one number';
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  
  // Check for common passwords
  const commonPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];
  
  if (commonPasswords.includes(password.toLowerCase())) {
    return 'Password is too common. Please choose a stronger password';
  }
  
  return null;
};

export const validateName = (name: string): string | null => {
  if (!name) return 'Name is required';
  
  if (name.length < 2) {
    return 'Name must be at least 2 characters long';
  }
  
  if (name.length > 50) {
    return 'Name must be less than 50 characters';
  }
  
  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(name)) {
    return 'Name can only contain letters, spaces, hyphens, and apostrophes';
  }
  
  return null;
};

export const validateConfirmPassword = (password: string, confirmPassword: string): string | null => {
  if (!confirmPassword) return 'Please confirm your password';
  
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  
  return null;
};

export const validateRequired = (value: string, fieldName: string): string | null => {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateMinLength = (value: string, minLength: number, fieldName: string): string | null => {
  if (value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters long`;
  }
  return null;
};

export const validateMaxLength = (value: string, maxLength: number, fieldName: string): string | null => {
  if (value.length > maxLength) {
    return `${fieldName} must be less than ${maxLength} characters`;
  }
  return null;
};

// Password strength indicator
export const getPasswordStrength = (password: string): {
  score: number;
  feedback: string[];
  color: 'error' | 'warning' | 'info' | 'success';
} => {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('At least 8 characters');
  }

  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('Include lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Include uppercase letters');
  }

  if (/\d/.test(password)) {
    score++;
  } else {
    feedback.push('Include numbers');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++;
  } else {
    feedback.push('Include special characters');
  }

  let color: 'error' | 'warning' | 'info' | 'success';
  if (score <= 1) color = 'error';
  else if (score <= 2) color = 'warning';
  else if (score <= 3) color = 'info';
  else color = 'success';

  return {
    score,
    feedback,
    color,
  };
}; 