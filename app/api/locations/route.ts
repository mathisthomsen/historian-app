import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '../../lib/api-helpers';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const { user, response } = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get locations with detailed counts and last used dates
    const locations = await prisma.$queryRaw`
      SELECT 
        location,
        SUM(event_count) as eventCount,
        SUM(life_event_count) as lifeEventCount,
        SUM(event_count + life_event_count) as totalCount,
        MAX(last_used) as lastUsed
      FROM (
        SELECT 
          location,
          COUNT(*) as event_count,
          0 as life_event_count,
          MAX(date) as last_used
        FROM events 
        WHERE userId = ${user.id} AND location IS NOT NULL AND location != ''
        GROUP BY location
        
        UNION ALL
        
        SELECT 
          location,
          0 as event_count,
          COUNT(*) as life_event_count,
          MAX(start_date) as last_used
        FROM life_events 
        WHERE userId = ${user.id} AND location IS NOT NULL AND location != ''
        GROUP BY location
      ) as all_locations
      GROUP BY location
      ORDER BY totalCount DESC, location ASC
      LIMIT 50
    ` as any[]

    // Transform the data to match the expected format
    const transformedLocations = locations.map((loc: any) => ({
      location: loc.location,
      eventCount: Number(loc.eventCount) || 0,
      lifeEventCount: Number(loc.lifeEventCount) || 0,
      totalCount: Number(loc.totalCount) || 0,
      lastUsed: loc.lastUsed ? new Date(loc.lastUsed).toISOString() : null
    }));

    const jsonResponse = NextResponse.json(transformedLocations)
    
    // If we have a response with new cookies, merge them
    if (response) {
      response.cookies.getAll().forEach(cookie => {
        jsonResponse.cookies.set(cookie.name, cookie.value, {
          httpOnly: cookie.httpOnly,
          secure: cookie.secure,
          sameSite: cookie.sameSite,
          maxAge: cookie.maxAge,
          path: cookie.path
        })
      })
    }

    return jsonResponse

  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
} 