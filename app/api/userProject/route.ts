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
        const userProjects = await prisma.userProject.findMany({
            where: {
                user_id: user.id
            }
        });

        return NextResponse.json({ userProjects });
    } catch (error) {
        return NextResponse.json(
            { error: 'Fehler beim Abrufen der Projekte' },
            { status: 500 }
        );
    }
}