import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '../../lib/api-helpers';

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

  const { user, response } = await getAuthenticatedUser(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

    const jsonResponse = NextResponse.json({
      literature,
      pagination: {
        page,
        limit,
        total: totalResult,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
    
    // If we have a response with new cookies, merge them
    if (response) {
      response.cookies.getAll().forEach(cookie => {
        jsonResponse.cookies.set(cookie.name, cookie.value, {
          httpOnly: cookie.httpOnly,
          secure: cookie.secure,
          sameSite: cookie.sameSite,
          maxAge: cookie.maxAge,
          path: cookie.path
        })
      })
    }

    return jsonResponse

  } catch (error) {
    console.error('Error fetching literature:', error)
    return NextResponse.json(
      { error: 'Failed to fetch literature' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const { user, response } = await getAuthenticatedUser(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    const literature = await prisma.$queryRaw`
      INSERT INTO literature ("userId", title, author, publication_year, type, description, url)
      VALUES (${user.id}, ${body.title}, ${body.author || null}, 
              ${body.publicationYear ? parseInt(body.publicationYear) : null}, 
              ${body.type || null}, ${body.description || null}, ${body.url || null})
    ` as any

    const jsonResponse = NextResponse.json({ success: true }, { status: 201 })
    
    // If we have a response with new cookies, merge them
    if (response) {
      response.cookies.getAll().forEach(cookie => {
        jsonResponse.cookies.set(cookie.name, cookie.value, {
          httpOnly: cookie.httpOnly,
          secure: cookie.secure,
          sameSite: cookie.sameSite,
          maxAge: cookie.maxAge,
          path: cookie.path
        })
      })
    }

    return jsonResponse

  } catch (error) {
    console.error('Error creating literature:', error)
    return NextResponse.json(
      { error: 'Failed to create literature' },
      { status: 500 }
    )
  }
} 