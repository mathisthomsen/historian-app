// app/api/events/route.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { NextResponse, NextRequest } from 'next/server';
import { requireUser, getOrCreateLocalUser } from '../../lib/requireUser';

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const localUser = await getOrCreateLocalUser(user);

  try {
    const data = await req.json();

    await prisma.$queryRaw`
      INSERT INTO events ("userId", title, description, date, end_date, location)
      VALUES (${localUser.id}, ${data.title}, ${data.description || null}, 
              ${data.date ? new Date(data.date) : null}, 
              ${data.end_date ? new Date(data.end_date) : null}, 
              ${data.location || null})
    `;

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const user = await requireUser();
  const localUser = await getOrCreateLocalUser(user);

  const { searchParams } = new URL(req.url);
  const all = searchParams.get('all') === 'true';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const skip = all ? undefined : (page - 1) * limit;
  const take = all ? undefined : limit;
  const sortField = searchParams.get('sortField');
  const sortOrder = searchParams.get('sortOrder') || 'asc';
  const filterField = searchParams.get('filterField');
  const filterValue = searchParams.get('filterValue');

  // Validate pagination parameters (skip for all=true)
  if (!all && (page < 1 || limit < 1 || limit > 100)) {
    return NextResponse.json({ error: 'Ungültige Paginierungsparameter' }, { status: 400 });
  }

  try {
    // Build where clause for filtering
    let whereClause: any = { userId: localUser.id };
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (filterField && filterValue) {
      whereClause[filterField] = { contains: filterValue, mode: 'insensitive' };
    }

    // Build orderBy for sorting
    let orderBy: any[] = [];
    if (sortField) {
      orderBy.push({ [sortField]: sortOrder });
    }
    orderBy.push({ date: 'desc' }, { title: 'asc' });

    // Get events with pagination
    let events, totalResult;
    if (all) {
      events = await prisma.events.findMany({
        where: whereClause,
        orderBy,
      });
      totalResult = events.length;
    } else {
      [events, totalResult] = await Promise.all([
        prisma.events.findMany({
          where: whereClause,
          skip,
          take,
          orderBy,
        }),
        prisma.events.count({ where: whereClause })
      ]);
    }

    const totalPages = all ? 1 : Math.ceil(totalResult / limit);
    const hasNextPage = all ? false : page < totalPages;
    const hasPrevPage = all ? false : page > 1;

    return NextResponse.json({
      events,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(totalResult),
        totalPages: Number(totalPages),
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
