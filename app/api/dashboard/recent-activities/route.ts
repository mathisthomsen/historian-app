import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireUser, getOrCreateLocalUser } from '../../../lib/requireUser'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  const user = await requireUser();
  const localUser = await getOrCreateLocalUser(user);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get recent activities from literature (only model with createdAt field)
    const recentLiterature = await prisma.literature.findMany({
      where: {
        userId: localUser.id
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

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent activities' },
      { status: 500 }
    );
  }
} 