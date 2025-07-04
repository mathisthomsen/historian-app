import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prisma'
import { requireUser, getOrCreateLocalUser } from '../../../lib/requireUser';

// 🟩 GET
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const localUser = await getOrCreateLocalUser(user);
  const { params } = context;
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const lifeEvent = await prisma.life_events.findFirst({ where: { id, userId: localUser.id } });

  if (!lifeEvent) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(lifeEvent);
}

// 🟨 PUT
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const localUser = await getOrCreateLocalUser(user);
  const { params } = context;
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const data = await req.json();

  try {
    // Check if life event belongs to user
    const existingEvent = await prisma.life_events.findFirst({
      where: { id, userId: localUser.id }
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Life event not found' }, { status: 404 });
    }

    const updated = await prisma.life_events.update({
      where: { id },
      data: {
        person_id: data.person_id,
        event_id: data.event_id,
        title: data.title,
        start_date: data.start_date ? new Date(data.start_date) : undefined,
        end_date: data.end_date ? new Date(data.end_date) : null,
        location: data.location,
        description: data.description,
        event_type_id: data.event_type_id,
        metadata: data.metadata ?? {},
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

// 🟥 DELETE
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const localUser = await getOrCreateLocalUser(user);
  const { params } = context;
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    // Check if life event belongs to user
    const existingEvent = await prisma.life_events.findFirst({
      where: { id, userId: localUser.id }
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Life event not found' }, { status: 404 });
    }

    await prisma.life_events.delete({ where: { id } });
    return NextResponse.json(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
