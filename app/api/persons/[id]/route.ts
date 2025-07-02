import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prisma'
import { getAuthenticatedUser } from '../../../lib/api-helpers';

// 🟩 GET – Einzelne Person holen
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { user, response } = await getAuthenticatedUser(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const person = await prisma.persons.findFirst({ 
    where: { 
      id,
      userId: user.id 
    } 
  });

  if (!person) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const jsonResponse = NextResponse.json(person);
  
  // If we have a response with new cookies, merge them
  if (response) {
    response.cookies.getAll().forEach(cookie => {
      jsonResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
  }

  return jsonResponse;
}

// 🟨 PUT – Person aktualisieren
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { user, response } = await getAuthenticatedUser(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const data = await req.json();

  try {
    // Check if person belongs to user
    const existingPerson = await prisma.persons.findFirst({
      where: { 
        id,
        userId: user.id 
      }
    });

    if (!existingPerson) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    const updated = await prisma.persons.update({
      where: { id },
      data: {
        first_name: data.first_name,
        last_name: data.last_name,
        birth_date: data.birth_date ? new Date(data.birth_date) : undefined,
        birth_place: data.birth_place,
        death_date: data.death_date ? new Date(data.death_date) : null,
        death_place: data.death_place,
        notes: data.notes,
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

// 🟥 DELETE – Person löschen
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { user, response } = await getAuthenticatedUser(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    // Check if person belongs to user
    const existingPerson = await prisma.persons.findFirst({
      where: { 
        id,
        userId: user.id 
      }
    });

    if (!existingPerson) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    await prisma.persons.delete({ where: { id } });
    
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
