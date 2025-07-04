import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { getAuthenticatedUser } from '../../../lib/api-helpers'

const prisma = new PrismaClient();

function parseDate(input: any): Date | null {
  if (!input || typeof input !== 'string') return null;
  if (/^\d{4}$/.test(input)) return new Date(`${input}-01-01`);
  const iso = new Date(input);
  if (!isNaN(iso.getTime())) return iso;
  const match = input.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (match) {
    const [_, day, month, year] = match;
    const formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const parsed = new Date(formatted);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const { user, response } = await getAuthenticatedUser(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json()
    
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }

    // Insert persons using raw query
    for (const person of data) {
      await prisma.$queryRaw`
        INSERT INTO persons ("userId", first_name, last_name, birth_date, birth_place, death_date, death_place, notes)
        VALUES (${user.id}, ${person.first_name || null}, ${person.last_name || null}, 
                ${person.birth_date ? new Date(person.birth_date) : null}, 
                ${person.birth_place || null}, 
                ${person.death_date ? new Date(person.death_date) : null}, 
                ${person.death_place || null}, 
                ${person.notes || null})
      `
    }

    const jsonResponse = NextResponse.json({ 
      success: true, 
      message: `Imported ${data.length} persons` 
    })
    
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
    console.error('Error importing persons:', error)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}
