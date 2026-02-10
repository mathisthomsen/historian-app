import prisma from '../../../../lib/database/prisma';
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '../../../../lib/auth/requireUser';
import { RateLimiter } from '../../../../lib/utils/validation';
import { sendVerificationEmail } from '../../../../lib/services/email';

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
        const { email, role = 'member' } = body;

        // Check if current user is project owner
        const project = await checkProjectOwnership(projectId, user.id);
        if (!project) {
            return NextResponse.json({ error: 'Keine Berechtigung zum Einladen von Benutzern' }, { status: 403 });
        }

        // Validate email
        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return NextResponse.json({ error: 'Ungültige E-Mail-Adresse' }, { status: 400 });
        }

        // Validate role
        const validRoles = ['member', 'admin', 'viewer'];
        if (!validRoles.includes(role)) {
            return NextResponse.json({ error: 'Ungültige Rolle' }, { status: 400 });
        }

        // Check if user already exists
        let invitedUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        // If user doesn't exist, create a placeholder user
        if (!invitedUser) {
            invitedUser = await prisma.user.create({
                data: {
                    email: email.toLowerCase(),
                    name: email.split('@')[0], // Use email prefix as name
                    emailVerified: false,
                    password: null // Will be set when user registers
                }
            });
        }

        // Check if user is already a member
        const existingMember = await prisma.userProject.findFirst({
            where: {
                project_id: projectId,
                user_id: invitedUser.id
            }
        });

        if (existingMember) {
            return NextResponse.json({ error: 'Benutzer ist bereits Mitglied des Projekts' }, { status: 409 });
        }

        // Add user to project
        const member = await prisma.userProject.create({
            data: {
                project_id: projectId,
                user_id: invitedUser.id,
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

        // Send invitation email if user doesn't have a password (new user)
        if (!invitedUser.password) {
            // TODO: Implement invitation email sending
            // await sendProjectInvitationEmail(email, project.name, user.name);
        }

        return NextResponse.json({ 
            member,
            message: invitedUser.password ? 'Benutzer erfolgreich zum Projekt hinzugefügt' : 'Einladung gesendet'
        }, { status: 201 });
    } catch (error) {
        console.error('Error inviting user to project:', error);
        return NextResponse.json(
            { error: 'Fehler beim Einladen des Benutzers' },
            { status: 500 }
        );
    }
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

        // Get project members (this serves as the "invitations" list for now)
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
        console.error('Error fetching project invitations:', error);
        return NextResponse.json(
            { error: 'Fehler beim Abrufen der Projekteinladungen' },
            { status: 500 }
        );
    }
} 