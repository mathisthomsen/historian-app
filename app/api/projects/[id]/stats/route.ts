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

        // Get project statistics
        const [
            eventsCount,
            personsCount,
            literatureCount,
            membersCount,
            recentActivity
        ] = await Promise.all([
            // Count events
            prisma.events.count({
                where: { project_id: projectId }
            }),
            // Count persons
            prisma.persons.count({
                where: { project_id: projectId }
            }),
            // Count literature
            prisma.literature.count({
                where: { project_id: projectId }
            }),
            // Count project members
            prisma.userProject.count({
                where: { project_id: projectId }
            }),
            // Get recent activity (last 10 events)
            prisma.events.findMany({
                where: { project_id: projectId },
                take: 10,
                select: {
                    id: true,
                    title: true
                }
            })
        ]);

        return NextResponse.json({
            projectId,
            stats: {
                events: eventsCount,
                persons: personsCount,
                literature: literatureCount,
                members: membersCount
            },
            recentActivity
        });

    } catch (error) {
        console.error('Error fetching project stats:', error);
        return NextResponse.json(
            { error: 'Fehler beim Abrufen der Projektstatistiken' },
            { status: 500 }
        );
    }
} 