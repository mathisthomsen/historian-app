import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prisma.ts'

type RouteContext = {
  params: { id: string };
};

// 🟩 GET
export async function GET(req: NextRequest, context: RouteContext) {
  const id = Number(context.params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const lifeEvent = await prisma.life_events.findUnique({ where: { id } });

  if (!lifeEvent) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(lifeEvent);
}

// 🟨 PUT
export async function PUT(req: NextRequest, context: RouteContext) {
  const id = Number(context.params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const data = await req.json();

  try {
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


// 🟨 Delete
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  if (!id) return new Response('ID fehlt oder ungültig', { status: 400 });

  try {
    await prisma.life_events.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response('Fehler beim Löschen', { status: 500 });
  }
}
