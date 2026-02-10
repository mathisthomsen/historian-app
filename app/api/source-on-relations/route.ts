// app/api/source-on-relations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/database/prisma';
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

// Source-on-Relation validation schema
const sourceOnRelationSchema = z.object({
  source_id: z.number().int().positive('Quellen-ID muss positiv sein'),
  relation_id: z.number().int().positive('Beziehungs-ID muss positiv sein'),
});

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
    const validation = sourceOnRelationSchema.safeParse(relationData);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: validation.error.errors },
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

    // Validate source access
    const source = await prisma.sources.findFirst({
      where: {
        id: validation.data.source_id,
        OR: [
          { userId: user.id },
          { project_id: { in: await getUserProjectIds(user.id) } }
        ]
      }
    });
    
    if (!source) {
      return NextResponse.json({ error: 'Quelle nicht gefunden oder keine Berechtigung' }, { status: 404 });
    }

    // Validate person-event relation access
    const relation = await prisma.personEventRelations.findFirst({
      where: {
        id: validation.data.relation_id,
        OR: [
          { userId: user.id },
          { project_id: { in: await getUserProjectIds(user.id) } }
        ]
      }
    });
    
    if (!relation) {
      return NextResponse.json({ error: 'Beziehung nicht gefunden oder keine Berechtigung' }, { status: 404 });
    }

    // Check for existing source-on-relation to prevent duplicates
    const existingSourceOnRelation = await prisma.sourceOnRelations.findFirst({
      where: {
        source_id: validation.data.source_id,
        relation_id: validation.data.relation_id
      }
    });

    if (existingSourceOnRelation) {
      return NextResponse.json(
        { error: 'Diese Quellen-Beziehung existiert bereits' },
        { status: 409 }
      );
    }

    const sourceOnRelation = await prisma.sourceOnRelations.create({
      data: {
        userId: user.id,
        project_id: projectId || null,
        source_id: validation.data.source_id,
        relation_id: validation.data.relation_id,
      }
    });

    return NextResponse.json({ success: true, sourceOnRelation }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating source-on-relation:', error);
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
    const sourceId = searchParams.get('sourceId');
    const relationId = searchParams.get('relationId');

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Ungültige Paginierungsparameter' }, { status: 400 });
    }

    // Get user's accessible project IDs
    const userProjectIds = await getUserProjectIds(user.id);

    // Build where clause for filtering
    let whereClause: any = { 
      OR: [
        { userId: user.id, project_id: null }, // Personal source-on-relations
        { project_id: { in: userProjectIds } } // Project source-on-relations
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

    // Filter by source if provided
    if (sourceId) {
      whereClause.source_id = parseInt(sourceId);
    }

    // Filter by relation if provided
    if (relationId) {
      whereClause.relation_id = parseInt(relationId);
    }

    // Get source-on-relations with pagination
    const skip = (page - 1) * limit;
    const [sourceOnRelations, totalResult] = await Promise.all([
      prisma.sourceOnRelations.findMany({
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
          source: {
            select: {
              id: true,
              title: true,
              author: true,
              publication: true,
              year: true,
              reliability: true
            }
          },
          relation: {
            select: {
              id: true,
              relationship_type: true,
              person: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true
                }
              },
              event: {
                select: {
                  id: true,
                  title: true,
                  date: true
                }
              },
              statement: {
                select: {
                  id: true,
                  content: true,
                  confidence: true
                }
              }
            }
          }
        }
      }),
      prisma.sourceOnRelations.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalResult / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      sourceOnRelations,
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
    console.error('Error fetching source-on-relations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 