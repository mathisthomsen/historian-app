import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireUser, getOrCreateLocalUser } from '../../../lib/requireUser'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  const user = await requireUser();
  const localUser = await getOrCreateLocalUser(user);

  try {
    // Simple counts using raw queries to avoid type issues
    const totalPersons = await prisma.$queryRaw`SELECT COUNT(*) as count FROM persons WHERE "userId" = ${localUser.id}` as any[]
    const totalEvents = await prisma.$queryRaw`SELECT COUNT(*) as count FROM events WHERE "userId" = ${localUser.id}` as any[]
    const totalLifeEvents = await prisma.$queryRaw`SELECT COUNT(*) as count FROM life_events WHERE "userId" = ${localUser.id}` as any[]
    const totalLiterature = await prisma.$queryRaw`SELECT COUNT(*) as count FROM literature WHERE "userId" = ${localUser.id}` as any[]
    
    // Count unique locations from events and life events
    const locationsResult = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT location) as count 
      FROM (
        SELECT location FROM events WHERE "userId" = ${localUser.id} AND location IS NOT NULL AND location != ''
        UNION
        SELECT location FROM life_events WHERE "userId" = ${localUser.id} AND location IS NOT NULL AND location != ''
      ) as locations
    ` as any[]
    
    // Count recent activity (only literature has createdAt field)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentActivityResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM literature WHERE "userId" = ${localUser.id} AND "createdAt" >= ${thirtyDaysAgo}
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
    return jsonResponse
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    )
  }
} 