// app/api/import-events/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { requireUser, getOrCreateLocalUser } from '../../../lib/requireUser';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const localUser = await getOrCreateLocalUser(user);

  try {
    const data = await req.json();
    
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Insert events using raw query
    for (const event of data) {
      await prisma.$queryRaw`
        INSERT INTO events ("userId", title, description, date, end_date, location)
        VALUES (${localUser.id}, ${event.title || 'Untitled'}, ${event.description || null}, 
                ${event.date ? new Date(event.date) : null}, 
                ${event.end_date ? new Date(event.end_date) : null}, 
                ${event.location || null})
      `;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Imported ${data.length} events` 
    });
  } catch (error) {
    console.error('Error importing events:', error);
    return NextResponse.json({ error: 'Import failed' }, { status: 500 });
  }
}
