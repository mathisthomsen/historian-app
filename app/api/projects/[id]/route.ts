import prisma from '@/app/lib/database/prisma';
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '../../../lib/auth/requireUser';
import { RateLimiter } from '../../../lib/utils/validation';

// Initialize rate limiter
const rateLimiter = new RateLimiter(60000, 100); // 100 requests per minute

// Helper function to get client IP
function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

// Helper function to check project access
async function checkProjectAccess(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { owner_id: userId },
        { members: { some: { user_id: userId } } }
      ]
    }
  });
  return project;
}

// Helper function to check project ownership
async function checkProjectOwnership(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      owner_id: userId
    }
  });
  return project;
}

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
        const projectId = resolvedParams.id;

        const project = await checkProjectAccess(projectId, user.id);

        if (!project) {
            return NextResponse.json({ error: 'Projekt nicht gefunden oder kein Zugriff' }, { status: 404 });
        }

        return NextResponse.json({ project });
    } catch (error) {
        console.error('Error fetching project:', error);
        return NextResponse.json(
            { error: 'Fehler beim Abrufen des Projekts' },
            { status: 500 }
        );
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
        const projectId = resolvedParams.id;
        const body = await req.json();

        // Check ownership - only owners can update projects
        const project = await checkProjectOwnership(projectId, user.id);
        if (!project) {
            return NextResponse.json({ error: 'Keine Berechtigung zum Bearbeiten dieses Projekts' }, { status: 403 });
        }

        const updatedProject = await prisma.project.update({
            where: { id: projectId },
            data: {
                name: body.name,
                description: body.description,
                updated_at: new Date(),
            },
        });

        return NextResponse.json({ project: updatedProject });
    } catch (error) {
        console.error('Error updating project:', error);
        return NextResponse.json(
            { error: 'Fehler beim Aktualisieren des Projekts' },
            { status: 500 }
        );
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
        const projectId = resolvedParams.id;

        // Check ownership - only owners can delete projects
        const project = await checkProjectOwnership(projectId, user.id);
        if (!project) {
            return NextResponse.json({ error: 'Keine Berechtigung zum Löschen dieses Projekts' }, { status: 403 });
        }

        const deletedProject =         await prisma.project.delete({
            where: { id: projectId },
        });

        return NextResponse.json({ project: deletedProject });
    } catch (error) {
        console.error('Error deleting project:', error);
        return NextResponse.json(
            { error: 'Fehler beim Löschen des Projekts' },
            { status: 500 }
        );
    }
}