import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../lib/auth/requireUser';
import prisma from '@/app/lib/database/prisma';

export async function GET(request: NextRequest) {
  const user = await requireUser();

  try {
    // Get user's accessible project IDs
    const userProjects = await prisma.userProject.findMany({
      where: { user_id: user.id },
      select: { project_id: true }
    });
    const userProjectIds = userProjects.map((up: any) => up.project_id);

    // Get dashboard stats for the user
    const [totalPersons, totalEvents, totalSources, recentActivity] = await Promise.all([
      prisma.persons.count({ 
        where: { 
          OR: [
            { userId: user.id },
            { project_id: { in: userProjectIds } }
          ]
        } 
      }),
      prisma.events.count({ 
        where: { 
          OR: [
            { userId: user.id },
            { project_id: { in: userProjectIds } }
          ]
        } 
      }),
      prisma.sources.count({ 
        where: { 
          OR: [
            { userId: user.id },
            { project_id: { in: userProjectIds } }
          ]
        } 
      }),
      prisma.authAuditLog.count({ where: { userId: user.id } })
    ]);

    return NextResponse.json({
      totalPersons,
      totalEvents,
      totalSources,
      totalLocations: 0, // Placeholder since locations table doesn't exist yet
      recentActivity,
      researchProjects: userProjectIds.length
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
} 