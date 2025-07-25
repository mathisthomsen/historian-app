import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../lib/requireUser';
import prisma from '../../libs/prisma';

export async function GET(request: NextRequest) {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;

  // Validate pagination parameters
  if (page < 1 || limit < 1 || limit > 100) {
    return NextResponse.json({ error: 'Ungültige Paginierungsparameter' }, { status: 400 });
  }

  try {
    // Get all unique locations for the user from both tables
    const locationsRaw = await prisma.$queryRaw`
      SELECT location FROM (
        SELECT location FROM events WHERE "userId" = ${user.id} AND location IS NOT NULL AND location != ''
        UNION
        SELECT location FROM life_events WHERE "userId" = ${user.id} AND location IS NOT NULL AND location != ''
      ) as locations
      ORDER BY location ASC
    ` as Array<{ location: string }>;

    const allLocations = locationsRaw.map(l => l.location);
    const totalLocations = allLocations.length;
    const pagedLocations = allLocations.slice(skip, skip + limit);

    // For each paged location, get stats
    const locations = await Promise.all(
      pagedLocations.map(async (location) => {
        const [eventCount, lifeEventCount, lastEvent, lastLifeEvent] = await Promise.all([
          prisma.events.count({ where: { userId: user.id, location } }),
          prisma.life_events.count({ where: { userId: user.id, location } }),
          prisma.events.findFirst({
            where: { userId: user.id, location },
            orderBy: { date: 'desc' },
            select: { date: true }
          }),
          prisma.life_events.findFirst({
            where: { userId: user.id, location },
            orderBy: { start_date: 'desc' },
            select: { start_date: true }
          })
        ]);
        // Find the most recent date
        let lastUsed: string | null = null;
        const eventDate = lastEvent?.date ? new Date(lastEvent.date) : null;
        const lifeEventDate = lastLifeEvent?.start_date ? new Date(lastLifeEvent.start_date) : null;
        if (eventDate && lifeEventDate) {
          lastUsed = eventDate > lifeEventDate ? eventDate.toISOString() : lifeEventDate.toISOString();
        } else if (eventDate) {
          lastUsed = eventDate.toISOString();
        } else if (lifeEventDate) {
          lastUsed = lifeEventDate.toISOString();
        }
        return {
          location,
          eventCount,
          lifeEventCount,
          totalCount: eventCount + lifeEventCount,
          lastUsed
        };
      })
    );

    // Get total event and life event counts for stats
    const [totalEvents, totalLifeEvents] = await Promise.all([
      prisma.events.count({ where: { userId: user.id } }),
      prisma.life_events.count({ where: { userId: user.id } })
    ]);

    const totalPages = Math.ceil(totalLocations / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      locations,
      pagination: {
        page,
        limit,
        total: totalLocations,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      totalEvents,
      totalLifeEvents
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
} 