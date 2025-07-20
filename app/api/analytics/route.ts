import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../lib/requireUser';
import prisma from '../../libs/prisma';

export async function GET(request: NextRequest) {
  const user = await requireUser();

  try {
    // Get analytics data for the user
    const [totalPersons, totalEvents, totalLifeEvents] = await Promise.all([
      prisma.persons.count({ where: { userId: user.id } }),
      prisma.events.count({ where: { userId: user.id } }),
      prisma.life_events.count({ where: { userId: user.id } })
    ]);

    return NextResponse.json({
      totalPersons,
      totalEvents,
      totalLifeEvents
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
} 