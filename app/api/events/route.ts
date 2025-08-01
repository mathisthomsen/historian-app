// app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import prisma from '../../libs/prisma';
import { requireUser } from '../../lib/requireUser';
import { authOptions } from '../../lib/auth';

export async function POST(req: NextRequest) {
  // Check authentication first
  const session = await getServerSession(authOptions as any);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  try {
    const user = (session as any).user;
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
  } catch (error: any) {
    console.error('Error creating event:', error);
    if (error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Check authentication first
  const session = await getServerSession(authOptions as any);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  try {
    const user = (session as any).user;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const search = searchParams.get('search') || '';
    const sortField = searchParams.get('sortField');
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const filterField = searchParams.get('filterField');
    const filterValue = searchParams.get('filterValue');
    const parentId = searchParams.get('parentId');

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Ungültige Paginierungsparameter' }, { status: 400 });
    }

    // Build where clause for filtering
    let whereClause: any = { userId: user.id };
    if (parentId !== null && parentId !== undefined) {
      if (parentId === 'null') {
        whereClause.parentId = null;
      } else {
        whereClause.parentId = parseInt(parentId);
      }
    }
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
    orderBy.push({ date: 'asc' });

    // Get events with pagination
    const skip = (page - 1) * limit;
    const [eventsRaw, totalResult] = await Promise.all([
      prisma.events.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy,
        include: {
          subEvents: true
        }
      }),
      prisma.events.count({ where: whereClause })
    ]);

    // Map subEventCount
    const events = eventsRaw.map(e => ({
      ...e,
      subEventCount: e.subEvents ? e.subEvents.length : 0,
    }));

    const totalPages = Math.ceil(totalResult / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

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
  } catch (error: any) {
    console.error('Error fetching events:', error);
    if (error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
