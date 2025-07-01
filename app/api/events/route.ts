// app/api/events/route.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { NextResponse, NextRequest } from 'next/server';
import { getAuthenticatedUser } from '../../lib/api-helpers';

export async function POST(req: NextRequest) {
  const { user, response } = await getAuthenticatedUser(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();

    const event = await prisma.$queryRaw`
      INSERT INTO events ("userId", title, description, date, end_date, location)
      VALUES (${user.id}, ${data.title}, ${data.description || null}, 
              ${data.date ? new Date(data.date) : null}, 
              ${data.end_date ? new Date(data.end_date) : null}, 
              ${data.location || null})
    ` as any

    const jsonResponse = NextResponse.json({ success: true }, { status: 201 })
    
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
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
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

    let query = `
      SELECT id, title, description, date, end_date, location
      FROM events 
      WHERE "userId" = ${user.id}
    `;

    if (location) {
      query += ` AND location = '${location.replace(/'/g, "''")}'`;
    }

    query += ` ORDER BY date ASC`;

    const events = await prisma.$queryRawUnsafe(query) as any[]

    const jsonResponse = NextResponse.json(events)
    
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
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}
