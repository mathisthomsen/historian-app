import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '../../lib/api-helpers';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { user, response } = await getAuthenticatedUser(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const literature = await prisma.$queryRaw`
      SELECT id, title, author, publication_year, publisher, isbn, notes, createdAt, updatedAt
      FROM literature 
      WHERE userId = ${user.id}
      ORDER BY createdAt DESC
    ` as any[]

    const jsonResponse = NextResponse.json(literature)
    
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
      INSERT INTO literature (userId, title, author, publication_year, type, description, url)
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