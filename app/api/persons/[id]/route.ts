import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/database/prisma';
import { requireUser, getOrCreateLocalUser } from '../../../lib/auth/requireUser';

// 🟩 GET – Einzelne Person holen
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
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
      },
      include: {
        birth_location_ref: true,
        death_location_ref: true,
      }
    });

    if (!person) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(person);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// 🟨 PUT – Person aktualisieren
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const localUser = await getOrCreateLocalUser(user);
    const { params } = context;
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    const data = await req.json();
    console.log('PUT data received:', data);

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

    // Simple update without geocoding for now
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
      include: {
        birth_location_ref: true,
        death_location_ref: true,
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ error: 'Update failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// 🟥 DELETE – Person löschen
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const localUser = await getOrCreateLocalUser(user);
    const { params } = context;
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

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
    console.error('DELETE error:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 });
  }
}
