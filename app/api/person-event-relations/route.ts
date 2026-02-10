// app/api/person-event-relations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../lib/database/prisma';
import { requireUser } from '../../lib/auth/requireUser';
import { RateLimiter } from '../../lib/utils/validation';
import { z } from 'zod';

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

// Person-Event Relation validation schema
const personEventRelationSchema = z.object({
  person_id: z.number().int().positive('Person-ID muss positiv sein'),
  event_id: z.number().int().positive('Event-ID muss positiv sein'),
  relationship_type: z.string().min(1, 'Beziehungstyp ist erforderlich').max(100, 'Beziehungstyp zu lang'),
  statement_id: z.number().int().positive('Statement-ID muss positiv sein').optional(),
});

// Valid relationship types
const VALID_RELATIONSHIP_TYPES = [
  'participant', 'witness', 'affected', 'organizer', 'leader', 'member',
  'supporter', 'opponent', 'victim', 'perpetrator', 'observer', 'reporter',
  'beneficiary', 'contributor', 'influencer', 'follower', 'mentor', 'student',
  'family_member', 'colleague', 'friend', 'enemy', 'ally', 'rival'
];

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
    const { projectId, ...relationData } = data;

    // Validate input
    const validation = personEventRelationSchema.safeParse(relationData);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: validation.error.errors },
        { status: 400 }
      );
    }

    // Validate relationship type
    if (!VALID_RELATIONSHIP_TYPES.includes(validation.data.relationship_type)) {
      return NextResponse.json(
        { error: 'Ungültiger Beziehungstyp' },
        { status: 400 }
      );
    }

    // Validate project access if projectId is provided
    if (projectId) {
      const userProjectIds = await getUserProjectIds(user.id);
      if (!userProjectIds.includes(projectId)) {
        return NextResponse.json({ error: 'Keine Berechtigung für dieses Projekt' }, { status: 403 });
      }
    }

    // Validate person access
    const person = await prisma.persons.findFirst({
      where: {
        id: validation.data.person_id,
        OR: [
          { userId: user.id },
          { project_id: { in: await getUserProjectIds(user.id) } }
        ]
      }
    });
    
    if (!person) {
      return NextResponse.json({ error: 'Person nicht gefunden oder keine Berechtigung' }, { status: 404 });
    }

    // Validate event access
    const event = await prisma.events.findFirst({
      where: {
        id: validation.data.event_id,
        OR: [
          { userId: user.id },
          { project_id: { in: await getUserProjectIds(user.id) } }
        ]
      }
    });
    
    if (!event) {
      return NextResponse.json({ error: 'Event nicht gefunden oder keine Berechtigung' }, { status: 404 });
    }

    // Validate statement access if provided
    if (validation.data.statement_id) {
      const statement = await prisma.statements.findFirst({
        where: {
          id: validation.data.statement_id,
          OR: [
            { userId: user.id },
            { project_id: { in: await getUserProjectIds(user.id) } }
          ]
        }
      });
      
      if (!statement) {
        return NextResponse.json({ error: 'Statement nicht gefunden oder keine Berechtigung' }, { status: 404 });
      }
    }

    // Check for existing relation to prevent duplicates
    const existingRelation = await prisma.personEventRelations.findFirst({
      where: {
        person_id: validation.data.person_id,
        event_id: validation.data.event_id,
        relationship_type: validation.data.relationship_type
      }
    });

    if (existingRelation) {
      return NextResponse.json(
        { error: 'Diese Beziehung existiert bereits' },
        { status: 409 }
      );
    }

    const relation = await prisma.personEventRelations.create({
      data: {
        userId: user.id,
        project_id: projectId || null,
        person_id: validation.data.person_id,
        event_id: validation.data.event_id,
        relationship_type: validation.data.relationship_type,
        statement_id: validation.data.statement_id || null,
      }
    });

    return NextResponse.json({ success: true, relation }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating person-event relation:', error);
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
    const projectId = searchParams.get('projectId');
    const personId = searchParams.get('personId');
    const eventId = searchParams.get('eventId');
    const relationshipType = searchParams.get('relationshipType');

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Ungültige Paginierungsparameter' }, { status: 400 });
    }

    // Get user's accessible project IDs
    const userProjectIds = await getUserProjectIds(user.id);

    // Build where clause for filtering
    let whereClause: any = { 
      OR: [
        { userId: user.id, project_id: null }, // Personal relations
        { project_id: { in: userProjectIds } } // Project relations
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

    // Filter by person if provided
    if (personId) {
      whereClause.person_id = parseInt(personId);
    }

    // Filter by event if provided
    if (eventId) {
      whereClause.event_id = parseInt(eventId);
    }

    // Filter by relationship type if provided
    if (relationshipType) {
      whereClause.relationship_type = relationshipType;
    }

    // Get relations with pagination
    const skip = (page - 1) * limit;
    const [relations, totalResult] = await Promise.all([
      prisma.personEventRelations.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          },
          person: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              birth_date: true,
              death_date: true
            }
          },
          event: {
            select: {
              id: true,
              title: true,
              date: true,
              location: true,
              end_date: true,
              location_id: true,
              latitude: true,
              longitude: true,
              country: true,
              region: true,
              city: true,
              description: true
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
                  author: true
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
                  year: true
                }
              }
            }
          }
        }
      }),
      prisma.personEventRelations.count({ where: whereClause })
    ]);

    // Calculate source statistics
    const relationsWithStats = relations.map(relation => ({
      ...relation,
      sourceCount: relation.sourceOnRelations.length,
      hasStatement: !!relation.statement,
      hasSources: relation.sourceOnRelations.length > 0
    }));

    const totalPages = Math.ceil(totalResult / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      relations: relationsWithStats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(totalResult),
        totalPages: Number(totalPages),
        hasNextPage,
        hasPrevPage
      },
      validRelationshipTypes: VALID_RELATIONSHIP_TYPES
    });
  } catch (error: any) {
    console.error('Error fetching person-event relations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 