import prisma from '@/app/lib/database/prisma';
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '../../lib/auth/requireUser';
import { RateLimiter } from '../../lib/utils/validation';

// Initialize rate limiter
const rateLimiter = new RateLimiter(60000, 100); // 100 requests per minute

// Helper function to get client IP
function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for') || 
         req.headers.get('x-real-ip') || 
         'unknown';
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
        // Get both owned projects and projects where user is a member
        const projects = await prisma.project.findMany({
            where: {
                OR: [
                    { owner_id: user.id },
                    { members: { some: { user_id: user.id } } }
                ]
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json({ projects });
    } catch (error) {
        console.error('Error fetching projects:', error);
        return NextResponse.json(
            { error: 'Fehler beim Abrufen der Projekte' },
            { status: 500 }
        );
    }
}

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
        const body = await req.json();
        const { name, description } = body;

        // Basic validation
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return NextResponse.json(
                { error: 'Projektname ist erforderlich' },
                { status: 400 }
            );
        }

        if (name.length > 255) {
            return NextResponse.json(
                { error: 'Projektname zu lang (max. 255 Zeichen)' },
                { status: 400 }
            );
        }

        // Create project
        const project = await prisma.project.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
                owner_id: user.id,
                updated_at: new Date(),
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });

        // Add creator as member
        await prisma.userProject.create({
            data: {
                user_id: user.id,
                project_id: project.id,
                role: 'owner'
            }
        });

        return NextResponse.json({ project }, { status: 201 });
    } catch (error) {
        console.error('Error creating project:', error);
        return NextResponse.json(
            { error: 'Fehler beim Erstellen des Projekts' },
            { status: 500 }
        );
    }
}