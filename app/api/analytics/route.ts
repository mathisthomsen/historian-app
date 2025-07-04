import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireUser, getOrCreateLocalUser } from '../../lib/requireUser'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  const user = await requireUser();
  const localUser = await getOrCreateLocalUser(user);
  if (!localUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }
  try {
    // Get events by year
    const eventsByYear = await prisma.$queryRaw`
      SELECT 
        EXTRACT(YEAR FROM date) as year,
        COUNT(*) as count
      FROM events 
      WHERE "userId" = ${localUser.id} AND date IS NOT NULL
      GROUP BY year
      ORDER BY year DESC
      LIMIT 10
    ` as any[]

    // Get events by location
    const eventsByLocation = await prisma.$queryRaw`
      SELECT 
        location,
        COUNT(*) as count
      FROM events 
      WHERE "userId" = ${localUser.id} AND location IS NOT NULL AND location != ''
      GROUP BY location
      ORDER BY count DESC
      LIMIT 10
    ` as any[]

    // Get recent activity (only literature has createdAt field)
    const recentActivity = await prisma.$queryRaw`
      SELECT 
        'literature' as type,
        id,
        title,
        "createdAt" as date
      FROM literature 
      WHERE "userId" = ${localUser.id}
      ORDER BY date DESC
      LIMIT 5
    ` as any[]

    // Get all events for the chart
    const events = await prisma.$queryRaw`
      SELECT 
        id,
        title,
        description,
        date,
        end_date,
        location
      FROM events 
      WHERE "userId" = ${localUser.id} AND date IS NOT NULL
      ORDER BY date ASC
    ` as any[]

    const analytics = {
      eventsByYear: eventsByYear.map(item => ({
        year: Number(item.year),
        count: Number(item.count)
      })),
      eventsByLocation: eventsByLocation.map(item => ({
        location: item.location,
        count: Number(item.count)
      })),
      recentActivity: recentActivity.map(item => ({
        type: item.type,
        title: item.title,
        date: item.date
      })),
      events: events.map(item => ({
        id: Number(item.id),
        title: item.title,
        description: item.description,
        date: item.date,
        end_date: item.end_date,
        location: item.location
      }))
    }

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
} 