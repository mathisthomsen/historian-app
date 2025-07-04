import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { NextRequest, NextResponse } from 'next/server'
import { validateAndSanitize, personSchema, RateLimiter } from '../../lib/validation'
import { getAuthenticatedUser } from '../../lib/api-helpers'

// Initialize rate limiter
const rateLimiter = new RateLimiter(60000, 100); // 100 requests per minute

// Helper function to get client IP
function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

export async function POST(req: NextRequest) {
  const { user, response } = await getAuthenticatedUser(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limiting
  const clientIp = getClientIP(req);
  if (!rateLimiter.isAllowed(clientIp)) {
    return NextResponse.json(
      { error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    
    // Validate and sanitize input
    const validation = validateAndSanitize(personSchema, body);
    if (validation.success === false) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: validation.errors },
        { status: 400 }
      );
    }

    const person = await prisma.persons.create({
      data: {
        first_name: validation.data.first_name || null,
        last_name: validation.data.last_name || null,
        birth_date: validation.data.birth_date ? new Date(validation.data.birth_date) : null,
        birth_place: validation.data.birth_place || null,
        death_date: validation.data.death_date ? new Date(validation.data.death_date) : null,
        death_place: validation.data.death_place || null,
        notes: validation.data.notes || null,
        userId: user.id
      }
    });
    
    const jsonResponse = NextResponse.json({ success: true, person }, { status: 201 });
    
    // If we have a response with new cookies, merge them
    if (response) {
      response.cookies.getAll().forEach(cookie => {
        jsonResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
    }
    
    return jsonResponse;
  } catch (error) {
    console.error('Error creating person:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { user, response } = await getAuthenticatedUser(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limiting
  const clientIp = getClientIP(req);
  if (!rateLimiter.isAllowed(clientIp)) {
    return NextResponse.json(
      { error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const skip = (page - 1) * limit
  const sortField = searchParams.get('sortField');
  const sortOrder = searchParams.get('sortOrder') || 'asc';
  const filterField = searchParams.get('filterField');
  const filterValue = searchParams.get('filterValue');

  // Validate pagination parameters
  if (page < 1 || limit < 1 || limit > 100) {
    return NextResponse.json(
      { error: 'Ungültige Paginierungsparameter' },
      { status: 400 }
    );
  }

  try {
    // Build where clause for filtering
    let whereClause: any = { userId: user.id };
    if (search) {
      whereClause.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (filterField && filterValue) {
      whereClause[filterField] = { contains: filterValue };
    }

    // Build orderBy for sorting
    let orderBy: any[] = [];
    if (sortField) {
      orderBy.push({ [sortField]: sortOrder });
    }
    // Always add fallback sort
    orderBy.push({ last_name: 'asc' }, { first_name: 'asc' });

    // Get persons with pagination
    let persons;
    let totalResult;
    
    [persons, totalResult] = await Promise.all([
      prisma.persons.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.persons.count({
        where: whereClause
      })
    ]);

    const totalPages = Math.ceil(totalResult / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const jsonResponse = NextResponse.json({
      persons,
      pagination: {
        page,
        limit,
        total: totalResult,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
    
    // If we have a response with new cookies, merge them
    if (response) {
      response.cookies.getAll().forEach(cookie => {
        jsonResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
    }
    
    return jsonResponse;
  } catch (error) {
    console.error('Error fetching persons:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}