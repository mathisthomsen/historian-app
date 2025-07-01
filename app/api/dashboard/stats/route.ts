import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getAuthenticatedUser } from '../../../lib/api-helpers'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { user, response } = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Simple counts using raw queries to avoid type issues
    const totalPersons = await prisma.$queryRaw`SELECT COUNT(*) as count FROM persons WHERE "userId" = ${user.id}` as any[]
    const totalEvents = await prisma.$queryRaw`SELECT COUNT(*) as count FROM events WHERE "userId" = ${user.id}` as any[]
    const totalLifeEvents = await prisma.$queryRaw`SELECT COUNT(*) as count FROM life_events WHERE "userId" = ${user.id}` as any[]
    const totalLiterature = await prisma.$queryRaw`SELECT COUNT(*) as count FROM literature WHERE "userId" = ${user.id}` as any[]
    
    // Count unique locations from events and life events
    const locationsResult = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT location) as count 
      FROM (
        SELECT location FROM events WHERE "userId" = ${user.id} AND location IS NOT NULL AND location != ''
        UNION
        SELECT location FROM life_events WHERE "userId" = ${user.id} AND location IS NOT NULL AND location != ''
      ) as locations
    ` as any[]
    
    // Count recent activity (only literature has createdAt field)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentActivityResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM literature WHERE "userId" = ${user.id} AND "createdAt" >= ${thirtyDaysAgo}
    ` as any[]

    const stats = {
      totalPersons: Number(totalPersons[0]?.count || 0),
      totalEvents: Number(totalEvents[0]?.count || 0),
      totalLifeEvents: Number(totalLifeEvents[0]?.count || 0),
      totalLocations: Number(locationsResult[0]?.count || 0),
      totalLiterature: Number(totalLiterature[0]?.count || 0),
      recentActivity: Number(recentActivityResult[0]?.count || 0),
      researchProjects: 0
    }

    const jsonResponse = NextResponse.json(stats)
    
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
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
} 