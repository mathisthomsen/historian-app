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

    const whereClause: any = {
      userId: user.id
    };

    if (location) {
      whereClause.location = location;
    }

    if (personId) {
      whereClause.person_id = parseInt(personId);
    }

    const lifeEvents = await prisma.life_events.findMany({
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

    // Transform the data to match the expected format
    const transformedEvents = lifeEvents.map(event => ({
      id: event.id,
      person_id: event.person_id,
      title: event.title,
      description: event.description,
      start_date: event.start_date,
      end_date: event.end_date,
      location: event.location,
      person: {
        id: event.persons?.id || 0,
        first_name: event.persons?.first_name || '',
        last_name: event.persons?.last_name || ''
      }
    }));

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
