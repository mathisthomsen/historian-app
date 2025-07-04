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
    // Get locations with detailed counts and last used dates
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
      LIMIT 50
    ` as any[]

    console.log('Raw SQL locations result:', locations);

    // Transform the data to match the expected format, handling possible property name mismatches
    const toNum = (v: any) => (typeof v === 'bigint' ? Number(v) : Number(v) || 0);
    const transformedLocations = locations.map((loc: any) => ({
      location: loc.location || loc.norm_location || '',
      eventCount: toNum(loc.eventCount ?? loc.eventcount),
      lifeEventCount: toNum(loc.lifeEventCount ?? loc.lifeeventcount),
      totalCount: toNum(loc.totalCount ?? loc.totalcount),
      lastUsed: loc.lastUsed ?? loc.lastused ? new Date(loc.lastUsed ?? loc.lastused).toISOString() : null
    }));

    console.log('Transformed locations response:', transformedLocations);

    return NextResponse.json(transformedLocations);
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
} 