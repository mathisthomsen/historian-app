// /api/life-events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { getAuthenticatedUser } from '../../lib/api-helpers';

export async function POST(req: NextRequest) {
  const { user, response } = await getAuthenticatedUser(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();

    const lifeEvent = await prisma.life_events.create({
      data: {
        userId: user.id,
        person_id: data.personId,
        title: data.title,
        description: data.description,
        start_date: data.date ? new Date(data.date) : null,
        location: data.location
      }
    });

    const jsonResponse = NextResponse.json({ success: true }, { status: 201 });
    
    // If we have a response with new cookies, merge them
    if (response) {
      response.cookies.getAll().forEach(cookie => {
        jsonResponse.cookies.set(cookie.name, cookie.value, {
          httpOnly: cookie.httpOnly,
          secure: cookie.secure,
          sameSite: cookie.sameSite,
          maxAge: cookie.maxAge,
          path: cookie.path
        });
      });
    }

    return jsonResponse;
  } catch (error) {
    console.error('Error creating life event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { user, response } = await getAuthenticatedUser(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get('location');
    const personId = searchParams.get('personId');
    const eventId = searchParams.get('eventId');

    const whereClause: any = {
      userId: user.id
    };

    if (location) {
      whereClause.location = location;
    }

    if (personId) {
      whereClause.person_id = parseInt(personId);
    }

    if (eventId) {
      whereClause.event_id = parseInt(eventId);
    }

    let lifeEvents: any[];
    if (location) {
      lifeEvents = await prisma.$queryRaw`
        SELECT le.*, p.id as person_id, p.first_name, p.last_name
        FROM life_events le
        LEFT JOIN persons p ON le.person_id = p.id
        WHERE le."userId" = ${user.id}
          AND LOWER(TRIM(le.location)) = LOWER(TRIM(${location}))
        ORDER BY le.start_date ASC
      ` as any[];
      // Map the raw result to match the expected format
      lifeEvents = lifeEvents.map((event: any) => ({
        ...event,
        persons: event.person_id ? {
          id: event.person_id,
          first_name: event.first_name,
          last_name: event.last_name
        } : null
      }));
    } else {
      lifeEvents = await prisma.life_events.findMany({
        where: whereClause,
        include: {
          persons: {
            select: {
              id: true,
              first_name: true,
              last_name: true
            }
          }
        },
        orderBy: {
          start_date: 'asc'
        }
      });
    }

    console.log('Raw SQL life events result:', lifeEvents);

    // Robust transformation for property names and BigInt
    const toNum = (v: any) => (typeof v === 'bigint' ? Number(v) : Number(v) || 0);
    const transformedEvents = lifeEvents.map(event => ({
      id: toNum(event.id),
      person_id: toNum(event.person_id),
      title: event.title ?? '',
      description: event.description ?? '',
      start_date: event.start_date ?? '',
      end_date: event.end_date ?? '',
      location: event.location ?? '',
      person: event.persons ? {
        id: toNum(event.persons.id),
        first_name: event.persons.first_name || '',
        last_name: event.persons.last_name || ''
      } : { id: 0, first_name: '', last_name: '' }
    }));

    console.log('Transformed life events response:', transformedEvents);

    const jsonResponse = NextResponse.json(transformedEvents);
    
    // If we have a response with new cookies, merge them
    if (response) {
      response.cookies.getAll().forEach(cookie => {
        jsonResponse.cookies.set(cookie.name, cookie.value, {
          httpOnly: cookie.httpOnly,
          secure: cookie.secure,
          sameSite: cookie.sameSite,
          maxAge: cookie.maxAge,
          path: cookie.path
        });
      });
    }

    return jsonResponse;
  } catch (error) {
    console.error('Error fetching life events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
