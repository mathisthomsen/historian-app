import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireUser, getOrCreateLocalUser } from '../../lib/requireUser';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const user = await requireUser();
  const localUser = await getOrCreateLocalUser(user);
  if (!localUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get total count of unique locations
    const totalCountResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM (
        SELECT LOWER(TRIM(location)) as norm_location
        FROM events WHERE "userId" = ${localUser.id} AND location IS NOT NULL AND TRIM(location) != ''
        GROUP BY norm_location
        UNION
        SELECT LOWER(TRIM(location)) as norm_location
        FROM life_events WHERE "userId" = ${localUser.id} AND location IS NOT NULL AND TRIM(location) != ''
        GROUP BY norm_location
      ) as all_locations` as any[];
    const total = Number(totalCountResult[0]?.count || 0);
    const totalPages = Math.ceil(total / limit);

    // Get total events and life events for all locations (fixed logic)
    const totalEvents = await prisma.events.count({
      where: {
        userId: localUser.id,
        location: { not: null, notIn: ['', ' '] }
      }
    });
    const totalLifeEvents = await prisma.life_events.count({
      where: {
        userId: localUser.id,
        location: { not: null, notIn: ['', ' '] }
      }
    });

    // Get paginated locations
    const locations = await prisma.$queryRaw`
      SELECT 
        norm_location as location,
        SUM(event_count) as eventCount,
        SUM(life_event_count) as lifeEventCount,
        SUM(event_count + life_event_count) as totalCount,
        MAX(last_used) as lastUsed
      FROM (
        SELECT 
          LOWER(TRIM(location)) as norm_location,
          COUNT(*) as event_count,
          0 as life_event_count,
          MAX(date) as last_used
        FROM events 
        WHERE "userId" = ${localUser.id} AND location IS NOT NULL AND TRIM(location) != ''
        GROUP BY norm_location
        
        UNION ALL
        
        SELECT 
          LOWER(TRIM(location)) as norm_location,
          0 as event_count,
          COUNT(*) as life_event_count,
          MAX(start_date) as last_used
        FROM life_events 
        WHERE "userId" = ${localUser.id} AND location IS NOT NULL AND TRIM(location) != ''
        GROUP BY norm_location
      ) as all_locations
      GROUP BY location
      ORDER BY totalCount DESC, location ASC
      LIMIT ${limit} OFFSET ${offset}
    ` as any[];

    const toNum = (v: any) => (typeof v === 'bigint' ? Number(v) : Number(v) || 0);
    const transformedLocations = locations.map((loc: any) => ({
      location: loc.location || loc.norm_location || '',
      eventCount: toNum(loc.eventCount ?? loc.eventcount),
      lifeEventCount: toNum(loc.lifeEventCount ?? loc.lifeeventcount),
      totalCount: toNum(loc.totalCount ?? loc.totalcount),
      lastUsed: loc.lastUsed ?? loc.lastused ? new Date(loc.lastUsed ?? loc.lastused).toISOString() : null
    }));

    return NextResponse.json({
      locations: transformedLocations,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      totalEvents,
      totalLifeEvents
    });
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
} 