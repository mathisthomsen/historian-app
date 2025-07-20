// app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { requireUser } from '../../lib/requireUser';

export async function POST(req: NextRequest) {
  const user = await requireUser();
  try {
    const data = await req.json();
    const event = await prisma.events.create({
      data: {
        userId: user.id,
        title: data.title,
        description: data.description,
        date: data.date ? new Date(data.date) : null,
        end_date: data.end_date ? new Date(data.end_date) : null,
        location: data.location,
        parentId: data.parentId ? Number(data.parentId) : null,
      }
    });
    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const user = await requireUser();
  try {
    const { searchParams } = new URL(req.url);
    const location = searchParams.get('location');
    const parentId = searchParams.get('parentId');

    const whereClause: any = {
      userId: user.id
    };

    if (location) {
      whereClause.location = location;
    }

    if (parentId) {
      whereClause.parentId = parseInt(parentId);
    }

    const events = await prisma.events.findMany({
      where: whereClause,
      include: {
        subEvents: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
