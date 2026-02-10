import prisma from '../../../../../lib/database/prisma';
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '../../../../../lib/auth/requireUser';
import { RateLimiter } from '../../../../../lib/utils/validation';

// Initialize rate limiter
const rateLimiter = new RateLimiter(60000, 100);

// Helper function to get client IP
function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('x-real-ip') || 
         'unknown';
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

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string; userId: string }> }) {
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
        const memberUserId = resolvedParams.userId;

        // Check if current user is project owner
        const project = await checkProjectOwnership(projectId, user.id);
        if (!project) {
            return NextResponse.json({ error: 'Keine Berechtigung zum Entfernen von Mitgliedern' }, { status: 403 });
        }

        // Prevent removing the project owner
        if (memberUserId === user.id) {
            return NextResponse.json({ error: 'Projektbesitzer kann nicht entfernt werden' }, { status: 400 });
        }

        // Check if member exists
        const member = await prisma.userProject.findFirst({
            where: {
                project_id: projectId,
                user_id: memberUserId
            }
        });

        if (!member) {
            return NextResponse.json({ error: 'Mitglied nicht gefunden' }, { status: 404 });
        }

        // Remove member
        await prisma.userProject.delete({
            where: {
                id: member.id
            }
        });

        return NextResponse.json({ message: 'Mitglied erfolgreich entfernt' });
    } catch (error) {
        console.error('Error removing project member:', error);
        return NextResponse.json(
            { error: 'Fehler beim Entfernen des Projektmitglieds' },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string; userId: string }> }) {
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
        const memberUserId = resolvedParams.userId;
        const body = await req.json();
        const { role } = body;

        // Check if current user is project owner
        const project = await checkProjectOwnership(projectId, user.id);
        if (!project) {
            return NextResponse.json({ error: 'Keine Berechtigung zum Bearbeiten von Mitgliedern' }, { status: 403 });
        }

        // Validate role
        const validRoles = ['member', 'admin', 'viewer'];
        if (!validRoles.includes(role)) {
            return NextResponse.json({ error: 'Ungültige Rolle' }, { status: 400 });
        }

        // Check if member exists
        const member = await prisma.userProject.findFirst({
            where: {
                project_id: projectId,
                user_id: memberUserId
            }
        });

        if (!member) {
            return NextResponse.json({ error: 'Mitglied nicht gefunden' }, { status: 404 });
        }

        // Update member role
        const updatedMember = await prisma.userProject.update({
            where: {
                id: member.id
            },
            data: {
                role: role
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        return NextResponse.json({ member: updatedMember });
    } catch (error) {
        console.error('Error updating project member:', error);
        return NextResponse.json(
            { error: 'Fehler beim Aktualisieren des Projektmitglieds' },
            { status: 500 }
        );
    }
} 