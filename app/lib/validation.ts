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
    
    for (const [identifier, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => time > windowStart);
      if (recentRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recentRequests);
      }
    }
  }
} 