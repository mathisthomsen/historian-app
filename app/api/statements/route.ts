// app/api/statements/route.ts
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

// Statement validation schema
const statementSchema = z.object({
  content: z.string().min(1, 'Inhalt ist erforderlich').max(2000, 'Inhalt zu lang'),
  confidence: z.number().min(0).max(1).optional(),
  source_id: z.number().int().positive('Quellen-ID muss positiv sein').optional(),
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
    const { projectId, ...statementData } = data;

    // Validate input
    const validation = statementSchema.safeParse(statementData);
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
    } else {
      // If no projectId is provided, allow creation without project (personal data)
      console.log('creating statement without project (personal data)');
    }

    // Validate source access if source_id is provided
    if (validation.data.source_id) {
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
    }

    const statement = await prisma.statements.create({
      data: {
        userId: user.id,
        project_id: projectId || null,
        content: validation.data.content,
        confidence: validation.data.confidence || null,
        source_id: validation.data.source_id || null,
      }
    });

    return NextResponse.json({ success: true, statement }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating statement:', error);
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
    const sortField = searchParams.get('sortField') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const projectId = searchParams.get('projectId');
    const sourceId = searchParams.get('sourceId');

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

    // Filter by source if provided
    if (sourceId) {
      whereClause.source_id = parseInt(sourceId);
    }

    // Add search filter
    if (search) {
      whereClause.content = { contains: search, mode: 'insensitive' };
    }

    // Build orderBy for sorting
    let orderBy: any = {};
    if (sortField === 'confidence') {
      orderBy.confidence = sortOrder;
    } else if (sortField === 'content') {
      orderBy.content = sortOrder;
    } else {
      orderBy.created_at = sortOrder;
    }

    // Get statements with pagination
    const skip = (page - 1) * limit;
    const [statements, totalResult] = await Promise.all([
      prisma.statements.findMany({
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
          source: {
            select: {
              id: true,
              title: true,
              author: true,
              year: true
            }
          },
          personEventRelations: {
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
              }
            }
          }
        }
      }),
      prisma.statements.count({ where: whereClause })
    ]);

    // Calculate usage statistics
    const statementsWithStats = statements.map(statement => ({
      ...statement,
      relationCount: statement.personEventRelations.length,
      hasRelations: statement.personEventRelations.length > 0
    }));

    const totalPages = Math.ceil(totalResult / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      statements: statementsWithStats,
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
    console.error('Error fetching statements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 