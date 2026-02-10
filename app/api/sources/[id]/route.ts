import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/database/prisma';
import { requireUser } from '../../../lib/auth/requireUser';
import { RateLimiter } from '../../../lib/utils/validation';
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
  publication: z.string().max(200, 'Publikation zu lang').optional(),
  year: z.number().int().min(1000, 'Jahr zu früh').max(new Date().getFullYear() + 10, 'Jahr zu spät').optional(),
  reliability: z.number().min(0, 'Zuverlässigkeit zu niedrig').max(1, 'Zuverlässigkeit zu hoch').optional(),
  notes: z.string().max(2000, 'Notizen zu lang').optional(),
});

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
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
    const { params } = context;
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 });
    }

    // Get user's accessible project IDs
    const userProjectIds = await getUserProjectIds(user.id);

    const source = await prisma.sources.findFirst({
      where: {
        id,
        OR: [
          { userId: user.id },
          { project_id: { in: userProjectIds } }
        ]
      },
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
            content: true,
            confidence: true
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
                    title: true,
                    date: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!source) {
      return NextResponse.json({ error: 'Quelle nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json(source);
  } catch (error: any) {
    console.error('Error fetching source:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
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
    const { params } = context;
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 });
    }

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

    // Get user's accessible project IDs
    const userProjectIds = await getUserProjectIds(user.id);

    // Check if source exists and user has access
    const existingSource = await prisma.sources.findFirst({
      where: {
        id,
        OR: [
          { userId: user.id },
          { project_id: { in: userProjectIds } }
        ]
      }
    });

    if (!existingSource) {
      return NextResponse.json({ error: 'Quelle nicht gefunden oder keine Berechtigung' }, { status: 404 });
    }

    // Validate project access if projectId is provided
    if (projectId) {
      if (!userProjectIds.includes(projectId)) {
        return NextResponse.json({ error: 'Keine Berechtigung für dieses Projekt' }, { status: 403 });
      }
    }

    const updatedSource = await prisma.sources.update({
      where: { id },
      data: {
        title: validation.data.title,
        url: validation.data.url || null,
        author: validation.data.author || null,
        publication: validation.data.publication || null,
        year: validation.data.year || null,
        reliability: validation.data.reliability || null,
        notes: validation.data.notes || null,
        project_id: projectId || existingSource.project_id,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, source: updatedSource });
  } catch (error: any) {
    console.error('Error updating source:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
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
    const { params } = context;
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Ungültige ID' }, { status: 400 });
    }

    // Get user's accessible project IDs
    const userProjectIds = await getUserProjectIds(user.id);

    // Check if source exists and user has access
    const existingSource = await prisma.sources.findFirst({
      where: {
        id,
        OR: [
          { userId: user.id },
          { project_id: { in: userProjectIds } }
        ]
      }
    });

    if (!existingSource) {
      return NextResponse.json({ error: 'Quelle nicht gefunden oder keine Berechtigung' }, { status: 404 });
    }

    // Delete the source (cascade will handle related records)
    await prisma.sources.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Quelle erfolgreich gelöscht' });
  } catch (error: any) {
    console.error('Error deleting source:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 