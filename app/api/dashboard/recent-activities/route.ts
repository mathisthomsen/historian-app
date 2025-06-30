import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAuthenticatedUser } from '../../../lib/api-helpers'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  const { user, response } = await getAuthenticatedUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get recent activities from literature (only model with createdAt field)
    const recentLiterature = await prisma.literature.findMany({
      where: {
        userId: user.id
      },
      select: {
        id: true,
        title: true,
        author: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    const activities = recentLiterature.map(item => ({
      id: item.id,
      type: 'literature',
      title: item.title,
      description: `Added literature: ${item.title} by ${item.author || 'Unknown'}`,
      date: item.createdAt
    }));

    const jsonResponse = NextResponse.json(activities)
    
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
    console.error('Error fetching recent activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent activities' },
      { status: 500 }
    )
  }
} 