import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../libs/prisma'
import { requireUser, getOrCreateLocalUser } from '../../../lib/requireUser';

// Force dynamic rendering to prevent build-time evaluation
export const dynamic = 'force-dynamic';

// 🟩 GET – Einzelne Person holen
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const localUser = await getOrCreateLocalUser(user);
  const { params } = context;
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const person = await prisma.persons.findFirst({ 
    where: { 
      id,
      userId: localUser.id 
    } 
  });

  if (!person) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(person);
}

// 🟨 PUT – Person aktualisieren
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const localUser = await getOrCreateLocalUser(user);
  const { params } = context;
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  const data = await req.json();

  try {
    // Check if person belongs to user
    const existingPerson = await prisma.persons.findFirst({
      where: { 
        id,
        userId: localUser.id 
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}

// 🟥 DELETE – Person löschen
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const localUser = await getOrCreateLocalUser(user);
  const { params } = context;
  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    // Check if person belongs to user
    const existingPerson = await prisma.persons.findFirst({
      where: { 
        id,
        userId: localUser.id 
      }
    });

    if (!existingPerson) {
      return NextResponse.json({ error: 'Person not found' }, { status: 404 });
    }

    await prisma.persons.delete({ where: { id } });
    return NextResponse.json(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 });
  }
}
