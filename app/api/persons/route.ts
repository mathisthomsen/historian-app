import prisma from '@/app/lib/database/prisma';
import { NextRequest, NextResponse } from 'next/server'
import { validateAndSanitize, personSchema, RateLimiter } from '../../lib/utils/validation'
import { requireUser } from '../../lib/auth/requireUser';

// Helper function to create or find location
async function createOrFindLocation(locationData: any) {
  if (!locationData || !locationData.latitude || !locationData.longitude) {
    return null;
  }

  // Check if location already exists
  const existingLocation = await prisma.locations.findFirst({
    where: {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
    }
  });

  if (existingLocation) {
    return existingLocation.id;
  }

  // Create new location
  const newLocation = await prisma.locations.create({
    data: {
      name: locationData.name || 'Unknown Location',
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      country: locationData.country || null,
      region: locationData.region || null,
      city: locationData.city || null,
    }
  });

  return newLocation.id;
}

// Initialize rate limiter
const rateLimiter = new RateLimiter(60000, 100); // 100 requests per minute

// Helper function to get client IP
function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

// Helper function to get user's accessible project IDs
async function getUserProjectIds(userId: string) {
  const userProjects = await prisma.userProject.findMany({
    where: { user_id: userId },
    select: { project_id: true }
  });
  console.log('userProjects:', userProjects);
  return userProjects.map((up: any) => up.project_id);
}

export async function POST(req: NextRequest) {
  const user = await requireUser();

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
    const { projectId, ...personData } = body;
    
    // Validate and sanitize input
    const validation = validateAndSanitize(personSchema, personData);
    if (validation.success === false) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: validation.errors },
        { status: 400 }
      );
    }

    // Validate project access if projectId is provided
    if (projectId) {
      const userProjectIds = await getUserProjectIds(user.id);
      console.log('userProjectIds:', userProjectIds);
      if (!userProjectIds.includes(projectId)) {
        return NextResponse.json({ error: 'Keine Berechtigung für dieses Projekt' }, { status: 403 });
      }
    } else {
      // If no projectId is provided, allow creation without project (personal data)
      console.log('creating person without project (personal data)');
    }

    console.log('creating person with projectId:', projectId);

    // Handle geocoding data
    let birthLocationId = null;
    let deathLocationId = null;

    if ((validation.data as any).birth_location_data) {
      birthLocationId = await createOrFindLocation((validation.data as any).birth_location_data);
    }

    if ((validation.data as any).death_location_data) {
      deathLocationId = await createOrFindLocation((validation.data as any).death_location_data);
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
        userId: user.id,
        project_id: projectId || null
      }
    });
    
    return NextResponse.json({ success: true, person }, { status: 201 });
  } catch (error) {
    console.error('Error creating person:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const user = await requireUser();

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
  const projectId = searchParams.get('projectId');

  // Validate pagination parameters
  if (page < 1 || limit < 1 || limit > 100) {
    return NextResponse.json(
      { error: 'Ungültige Paginierungsparameter' },
      { status: 400 }
    );
  }

  try {
    // Get user's accessible project IDs
    const userProjectIds = await getUserProjectIds(user.id);

    // Build where clause for filtering
    let whereClause: any = { 
      OR: [
        { userId: user.id }, // All personal data (with or without project)
        { project_id: { in: userProjectIds } } // Project data (if user has project access)
      ]
    };

    // Filter by specific project if provided
    if (projectId) {
      if (!userProjectIds.includes(projectId)) {
        return NextResponse.json({ error: 'Keine Berechtigung für dieses Projekt' }, { status: 403 });
      }
      whereClause = { 
        project_id: projectId
      };
    }

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
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          },
          // New: Include person-event relations
          personEventRelations: {
            select: {
              id: true,
              relationship_type: true,
              event: {
                select: {
                  id: true,
                  title: true,
                  date: true,
                  location: true
                }
              },
              statement: {
                select: {
                  id: true,
                  content: true,
                  confidence: true,
                  source: {
                    select: {
                      id: true,
                      title: true,
                      author: true,
                      year: true
                    }
                  }
                }
              },
              sourceOnRelations: {
                select: {
                  id: true,
                  source: {
                    select: {
                      id: true,
                      title: true,
                      author: true,
                      year: true,
                      reliability: true
                    }
                  }
                }
              }
            }
          }
        }
      }),
      prisma.persons.count({
        where: whereClause
      })
    ]);

    const totalPages = Math.ceil(totalResult / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Calculate event participation statistics
    const personsWithStats = persons.map(person => ({
      ...person,
      eventCount: person.personEventRelations ? person.personEventRelations.length : 0,
      hasEvents: person.personEventRelations ? person.personEventRelations.length > 0 : false,
      // Group events by relationship type
      eventsByType: person.personEventRelations ? 
        person.personEventRelations.reduce((acc: any, rel: any) => {
          const type = rel.relationship_type;
          if (!acc[type]) acc[type] = [];
          acc[type].push(rel);
          return acc;
        }, {}) : {}
    }));

    // Use parsed numbers for pagination
    return NextResponse.json({
      persons: personsWithStats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(totalResult),
        totalPages: Number(totalPages),
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error fetching persons:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}