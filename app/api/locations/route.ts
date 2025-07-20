import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../lib/requireUser';
import prisma from '../../libs/prisma';

export async function GET(request: NextRequest) {
  const user = await requireUser();

  try {
    // Get unique locations from events and life events
    const locations = await prisma.$queryRaw`
      SELECT DISTINCT location 
      FROM (
        SELECT location FROM events WHERE "userId" = ${user.id} AND location IS NOT NULL AND location != ''
        UNION
        SELECT location FROM life_events WHERE "userId" = ${user.id} AND location IS NOT NULL AND location != ''
      ) as locations
      ORDER BY location ASC
    ` as any[];

    return NextResponse.json(locations.map(loc => loc.location));
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
} 