// app/api/sources/route.ts
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

// Source validation schema
const sourceSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').max(500, 'Titel zu lang'),
  url: z.string().url('Ungültige URL').optional().or(z.literal('')),
  author: z.string().max(200, 'Autor zu lang').optional(),
  publication: z.string().max(300, 'Publikation zu lang').optional(),
  year: z.number().int().min(1000).max(new Date().getFullYear() + 10).optional(),
  reliability: z.number().min(0).max(1).optional(),
  notes: z.string().max(5000, 'Notizen zu lang').optional(),
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
    const { projectId, ...sourceData } = data;

    // Validate input
    const validation = sourceSchema.safeParse(sourceData);
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
      console.log('creating source without project (personal data)');
    }

    const source = await prisma.sources.create({
      data: {
        userId: user.id,
        project_id: projectId || null,
        title: validation.data.title,
        url: validation.data.url || null,
        author: validation.data.author || null,
        publication: validation.data.publication || null,
        year: validation.data.year || null,
        reliability: validation.data.reliability || null,
        notes: validation.data.notes || null,
      }
    });

    return NextResponse.json({ success: true, source }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating source:', error);
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

    // Add search filter
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { publication: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Build orderBy for sorting
    let orderBy: any = {};
    if (sortField === 'reliability') {
      orderBy.reliability = sortOrder;
    } else if (sortField === 'year') {
      orderBy.year = sortOrder;
    } else if (sortField === 'title') {
      orderBy.title = sortOrder;
    } else {
      orderBy.created_at = sortOrder;
    }

    // Get sources with pagination
    const skip = (page - 1) * limit;
    const [sources, totalResult] = await Promise.all([
      prisma.sources.findMany({
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
          statements: {
            select: {
              id: true,
              content: true
            }
          },
          sourceOnRelations: {
            select: {
              id: true,
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
                      title: true
                    }
                  }
                }
              }
            }
          }
        }
      }),
      prisma.sources.count({ where: whereClause })
    ]);

    // Calculate usage statistics
    const sourcesWithStats = sources.map(source => ({
      ...source,
      statementCount: source.statements.length,
      relationCount: source.sourceOnRelations.length,
      totalUsage: source.statements.length + source.sourceOnRelations.length
    }));

    const totalPages = Math.ceil(totalResult / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      sources: sourcesWithStats,
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
    console.error('Error fetching sources:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 