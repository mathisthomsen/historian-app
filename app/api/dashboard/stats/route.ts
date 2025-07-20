import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../lib/requireUser';
import prisma from '../../../libs/prisma';

export async function GET(request: NextRequest) {
  const user = await requireUser();

  try {
    // Get dashboard stats for the user
    const [totalPersons, totalEvents, totalLifeEvents, totalLiterature, recentActivity] = await Promise.all([
      prisma.persons.count({ where: { userId: user.id } }),
      prisma.events.count({ where: { userId: user.id } }),
      prisma.life_events.count({ where: { userId: user.id } }),
      prisma.literature.count({ where: { userId: user.id } }),
      prisma.authAuditLog.count({ where: { userId: user.id } })
    ]);

    return NextResponse.json({
      totalPersons,
      totalEvents,
      totalLifeEvents,
      totalLiterature,
      totalLocations: 0, // Placeholder since locations table doesn't exist yet
      recentActivity,
      researchProjects: 0 // Placeholder for now
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
} 