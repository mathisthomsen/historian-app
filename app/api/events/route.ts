// app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/database/prisma';
import { requireUser } from '../../lib/auth/requireUser';
import { RateLimiter } from '../../lib/utils/validation';
import { Prisma } from '@prisma/client';

// Initialize rate limiter
const rateLimiter = new RateLimiter(60000, 100);

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
    const data = await req.json();
    const { projectId, ...eventData } = data;

    // Validate project access if projectId is provided
    if (projectId) {
      const userProjectIds = await getUserProjectIds(user.id);
      if (!userProjectIds.includes(projectId)) {
        return NextResponse.json({ error: 'Keine Berechtigung für dieses Projekt' }, { status: 403 });
      }
    }

    const event = await prisma.events.create({
      data: {
        userId: user.id,
        project_id: projectId || null,
        title: eventData.title,
        description: eventData.description,
        date: eventData.date ? new Date(eventData.date) : null,
        end_date: eventData.end_date ? new Date(eventData.end_date) : null,
        location: eventData.location,
        parentId: eventData.parentId ? Number(eventData.parentId) : null,
        // Location validation fields
        latitude: eventData.latitude ? new Prisma.Decimal(eventData.latitude) : null,
        longitude: eventData.longitude ? new Prisma.Decimal(eventData.longitude) : null,
        country: eventData.country || null,
        region: eventData.region || null,
        city: eventData.city || null,
      }
    });
    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
  
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const search = searchParams.get('search') || '';
    const sortField = searchParams.get('sortField');
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const filterField = searchParams.get('filterField');
    const filterValue = searchParams.get('filterValue');
    const parentId = searchParams.get('parentId');
    const projectId = searchParams.get('projectId');

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Ungültige Paginierungsparameter' }, { status: 400 });
    }

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

    if (parentId !== null && parentId !== undefined) {
      if (parentId === 'null') {
        whereClause.parentId = null;
      } else {
        whereClause.parentId = parseInt(parentId);
      }
    }
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (filterField && filterValue) {
      whereClause[filterField] = { contains: filterValue, mode: 'insensitive' };
    }

    // Build orderBy for sorting
    let orderBy: any[] = [];
    if (sortField) {
      orderBy.push({ [sortField]: sortOrder });
    }
    orderBy.push({ date: 'asc' });

    // Get events with pagination
    const skip = (page - 1) * limit;
    const [eventsRaw, totalResult] = await Promise.all([
      prisma.events.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy,
        include: {
          subEvents: true,
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
              person: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  birth_date: true,
                  death_date: true
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
      prisma.events.count({ where: whereClause })
    ]);

    // Map subEventCount and calculate participant statistics
    const events = eventsRaw.map(e => ({
      ...e,
      subEventCount: e.subEvents ? e.subEvents.length : 0,
      participantCount: e.personEventRelations ? e.personEventRelations.length : 0,
      hasParticipants: e.personEventRelations ? e.personEventRelations.length > 0 : false,
      // Group participants by relationship type
      participantsByType: e.personEventRelations ? 
        e.personEventRelations.reduce((acc: any, rel: any) => {
          const type = rel.relationship_type;
          if (!acc[type]) acc[type] = [];
          acc[type].push(rel);
          return acc;
        }, {}) : {}
    }));

    const totalPages = Math.ceil(totalResult / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      events,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(totalResult),
        totalPages: Number(totalPages),
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error: any) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
