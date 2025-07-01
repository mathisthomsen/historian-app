import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prisma'
import { getAuthenticatedUser } from '../../../lib/api-helpers';

// 🟩 GET
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  const { user, response } = await getAuthenticatedUser(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { params } = await context;
  const id = Number(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const event = await prisma.events.findFirst({ 
    where: { 
      id,
      userId: user.id 
    } 
  });

  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const jsonResponse = NextResponse.json(event);
  
  // If we have a response with new cookies, merge them
  if (response) {
    response.cookies.getAll().forEach(cookie => {
      jsonResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
  }

  return jsonResponse;
}

// 🟨 PUT
export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  const { user, response } = await getAuthenticatedUser(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { params } = await context;
  const id = Number(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const data = await req.json();

  try {
    // Check if event belongs to user
    const existingEvent = await prisma.events.findFirst({
      where: { 
        id,
        userId: user.id 
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

    const jsonResponse = NextResponse.json(updated);
    
    // If we have a response with new cookies, merge them
    if (response) {
      response.cookies.getAll().forEach(cookie => {
        jsonResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
    }

    return jsonResponse;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

// 🟨 Delete
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, response } = await getAuthenticatedUser(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    // Check if event belongs to user
    const existingEvent = await prisma.events.findFirst({
      where: { 
        id,
        userId: user.id 
      }
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await prisma.events.delete({ where: { id } });
    
    const jsonResponse = NextResponse.json(null, { status: 204 });
    
    // If we have a response with new cookies, merge them
    if (response) {
      response.cookies.getAll().forEach(cookie => {
        jsonResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
    }

    return jsonResponse;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 });
  }
}
