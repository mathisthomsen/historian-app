import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../lib/auth/requireUser';
import prisma from '@/app/lib/database/prisma';
import { geocodingService } from '../../lib/services/geocoding';

// Helper function to get user's accessible project IDs
async function getUserProjectIds(userId: string) {
  const userProjects = await prisma.userProject.findMany({
    where: { user_id: userId },
    select: { project_id: true }
  });
  return userProjects.map((up: any) => up.project_id);
}

// Helper function to geocode a location
async function geocodeLocation(locationName: string) {
  try {
    const result = await geocodingService.geocode(locationName);
    return result;
  } catch (error) {
    console.warn(`Failed to geocode ${locationName}:`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const projectId = searchParams.get('projectId') || '';
  const skip = (page - 1) * limit;

  // Validate pagination parameters
  if (page < 1 || limit < 1 || limit > 100) {
    return NextResponse.json({ error: 'Ungültige Paginierungsparameter' }, { status: 400 });
  }

  try {
    // Get user's accessible project IDs
    const userProjectIds = await getUserProjectIds(user.id);
    console.log('User project IDs:', userProjectIds, 'Requested project ID:', projectId);
    
    // Validate project access if projectId is provided
    if (projectId) {
      if (!userProjectIds.includes(projectId)) {
        return NextResponse.json({ error: 'Keine Berechtigung für dieses Projekt' }, { status: 403 });
      }
      
      // Verify the project actually exists
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });
      
      if (!project) {
        return NextResponse.json({ error: 'Projekt nicht gefunden' }, { status: 404 });
      }
    }

    // Handle case where user has no projects
    if (userProjectIds.length === 0 && !projectId) {
      console.log('User has no projects, returning empty result');
      return NextResponse.json({
        locations: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        },
        totalEvents: 0,
        totalLifeEvents: 0
      });
    }

    // Build where clauses for project filtering
    const projectWhereClause = projectId 
      ? { equals: projectId }
      : { in: userProjectIds };
    
    console.log('Project where clause:', JSON.stringify(projectWhereClause));

    // Get all unique locations for the user from events table
    const eventLocations = await prisma.events.findMany({
      where: {
        userId: user.id,
        AND: [
          { location: { not: null } },
          { location: { not: '' } }
        ],
        project_id: projectWhereClause
      },
      select: { location: true }
    });

    // Extract unique locations
    const uniqueLocations = [...new Set(eventLocations.map(e => e.location).filter(Boolean))];
    
    // Get total count for pagination
    const total = uniqueLocations.length;
    
    // Apply pagination
    const paginatedLocations = uniqueLocations.slice(skip, skip + limit);
    
    // Get detailed location information with counts
    const locationsWithStats = await Promise.all(
      paginatedLocations.map(async (locationName) => {
        const eventCount = await prisma.events.count({
          where: {
            userId: user.id,
            location: locationName,
            project_id: projectWhereClause
          }
        });

        const location = await prisma.locations.findFirst({
          where: { name: locationName || '' }
        });

        return {
          name: locationName,
          events: eventCount,
          total: eventCount,
          location: location || null
        };
      })
    );

    return NextResponse.json({
      locations: locationsWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      },
      totalEvents: total
    });

  } catch (error: unknown) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch locations',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
} 