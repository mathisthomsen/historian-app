import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireUser } from '../../lib/requireUser';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const skip = (page - 1) * limit;
  const sortField = searchParams.get('sortField');
  const sortOrder = searchParams.get('sortOrder') || 'asc';
  const filterField = searchParams.get('filterField');
  const filterValue = searchParams.get('filterValue');

  // Validate pagination parameters
  if (page < 1 || limit < 1 || limit > 100) {
    return NextResponse.json({ error: 'Ungültige Paginierungsparameter' }, { status: 400 });
  }

  const user = await requireUser();

  try {
    // Build where clause for filtering
    let whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
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
    orderBy.push({ title: 'asc' });

    // Get literature with pagination
    const [literature, totalResult] = await Promise.all([
      prisma.literature.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy,
      }),
      prisma.literature.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalResult / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      literature,
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
    console.error('Error fetching literature:', error)
    return NextResponse.json(
      { error: 'Failed to fetch literature' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const user = await requireUser();

  try {
    const body = await req.json();

    const literature = await prisma.$queryRaw`
      INSERT INTO literature ("userId", title, author, publication_year, type, description, url)
      VALUES (${user.id}, ${body.title}, ${body.author || null}, 
              ${body.publicationYear ? parseInt(body.publicationYear) : null}, 
              ${body.type || null}, ${body.description || null}, ${body.url || null})
    ` as any

    return NextResponse.json({ success: true }, { status: 201 })

  } catch (error) {
    console.error('Error creating literature:', error)
    return NextResponse.json(
      { error: 'Failed to create literature' },
      { status: 500 }
    )
  }
} 