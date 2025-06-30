// app/api/import-events/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '../../../lib/api-helpers'

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { user, response } = await getAuthenticatedUser(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();
    
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Insert events using raw query
    for (const event of data) {
      await prisma.$queryRaw`
        INSERT INTO events (userId, title, description, date, end_date, location)
        VALUES (${user.id}, ${event.title || 'Untitled'}, ${event.description || null}, 
                ${event.date ? new Date(event.date) : null}, 
                ${event.end_date ? new Date(event.end_date) : null}, 
                ${event.location || null})
      `;
    }

    const jsonResponse = NextResponse.json({ 
      success: true, 
      message: `Imported ${data.length} events` 
    });
    
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
    console.error('Error importing events:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
