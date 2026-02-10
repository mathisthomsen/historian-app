import prisma from '../../../../lib/database/prisma';
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '../../../../lib/auth/requireUser';
import { RateLimiter } from '../../../../lib/utils/validation';

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

        // Check if user has access to this project
        const project = await prisma.project.findFirst({
            where: {
                id: projectId,
                OR: [
                    { owner_id: user.id },
                    { members: { some: { user_id: user.id } } }
                ]
            }
        });

        if (!project) {
            return NextResponse.json({ error: 'Projekt nicht gefunden oder kein Zugriff' }, { status: 404 });
        }

        // Get project members
        const members = await prisma.userProject.findMany({
            where: {
                project_id: projectId
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

        return NextResponse.json({ members });
    } catch (error) {
        console.error('Error fetching project members:', error);
        return NextResponse.json(
            { error: 'Fehler beim Abrufen der Projektmitglieder' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
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
        const { userId, role = 'member' } = body;

        // Check if current user is project owner
        const project = await checkProjectOwnership(projectId, user.id);
        if (!project) {
            return NextResponse.json({ error: 'Keine Berechtigung zum Hinzufügen von Mitgliedern' }, { status: 403 });
        }

        // Check if user to add exists
        const userToAdd = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!userToAdd) {
            return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
        }

        // Check if user is already a member
        const existingMember = await prisma.userProject.findFirst({
            where: {
                project_id: projectId,
                user_id: userId
            }
        });

        if (existingMember) {
            return NextResponse.json({ error: 'Benutzer ist bereits Mitglied des Projekts' }, { status: 409 });
        }

        // Add user to project
        const member = await prisma.userProject.create({
            data: {
                project_id: projectId,
                user_id: userId,
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

        return NextResponse.json({ member }, { status: 201 });
    } catch (error) {
        console.error('Error adding project member:', error);
        return NextResponse.json(
            { error: 'Fehler beim Hinzufügen des Projektmitglieds' },
            { status: 500 }
        );
    }
} 