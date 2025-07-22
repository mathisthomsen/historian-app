import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../lib/requireUser';
import prisma from '../../../libs/prisma';

export async function GET(request: NextRequest) {
  const user = await requireUser();

  try {
    // Get recent activities for the user from multiple sources
    const recentActivities = await prisma.authAuditLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        eventType: true,
        createdAt: true,
        details: true
      }
    });

    // Transform the activities to match the expected format
    const transformedActivities = recentActivities.map((activity: {
      id: number;
      eventType: string;
      createdAt: Date;
      details: any;
    }) => ({
      id: activity.id,
      type: 'activity',
      action: activity.eventType.toLowerCase().includes('created') ? 'created' : 'updated',
      title: `${activity.eventType} activity`,
      timestamp: activity.createdAt.toISOString()
    }));

    return NextResponse.json(transformedActivities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return NextResponse.json({ error: 'Failed to fetch recent activities' }, { status: 500 });
  }
} 