import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prisma'
import { requireUser, getOrCreateLocalUser } from '../../../lib/requireUser';

// Force dynamic rendering to prevent build-time evaluation
export const dynamic = 'force-dynamic';

// 🟩 GET
export async function GET(req: NextRequest, context: { params: Promise<{ eventId: string }> }) {
  const user = await requireUser();
  const localUser = await getOrCreateLocalUser(user);
  const { params } = context;
  const resolvedParams = await params;
  const id = Number(resolvedParams.eventId);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  // Fetch event and its sub-events
  const event = await prisma.events.findFirst({ 
    where: { 
      id,
      userId: localUser.id 
    },
    include: {
      subEvents: true
    }
  });

  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(event);
}

// 🟨 PUT
export async function PUT(req: NextRequest, context: { params: Promise<{ eventId: string }> }) {
  const user = await requireUser();
  const localUser = await getOrCreateLocalUser(user);
  const { params } = context;
  const resolvedParams = await params;
  const id = Number(resolvedParams.eventId);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const data = await req.json();

  try {
    // Check if event belongs to user
    const existingEvent = await prisma.events.findFirst({
      where: { 
        id,
        userId: localUser.id 
      }
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const updated = await prisma.events.update({
      where: { id },
      data: {
        title: data.title,
        date: data.date ? new Date(data.date) : undefined,
        end_date: data.end_date ? new Date(data.end_date) : null,
        location: data.location,
        description: data.description,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

// 🟥 DELETE
export async function DELETE(req: NextRequest, context: { params: Promise<{ eventId: string }> }) {
  const user = await requireUser();
  const localUser = await getOrCreateLocalUser(user);
  const { params } = context;
  const resolvedParams = await params;
  const id = Number(resolvedParams.eventId);
  if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    // Check if event belongs to user
    const existingEvent = await prisma.events.findFirst({
      where: { 
        id,
        userId: localUser.id 
      }
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await prisma.events.delete({ where: { id } });
    return NextResponse.json(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 });
  }
}
