import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '../../../lib/auth/requireUser';
import prisma from '@/app/lib/database/prisma';
import { geocodingService } from '../../../lib/services/geocoding';
import { Prisma } from '@prisma/client';

// Helper function to get user's accessible project IDs
async function getUserProjectIds(userId: string) {
  const userProjects = await prisma.userProject.findMany({
    where: { user_id: userId },
    select: { project_id: true }
  });
  return userProjects.map((up: any) => up.project_id);
}

export async function POST(req: NextRequest) {
  const user = await requireUser();

  try {
    const { locationName, projectId } = await req.json();

    if (!locationName || typeof locationName !== 'string') {
      return NextResponse.json({ error: 'Location name is required' }, { status: 400 });
    }

    // Validate project access if projectId is provided
    if (projectId) {
      const userProjectIds = await getUserProjectIds(user.id);
      if (!userProjectIds.includes(projectId)) {
        return NextResponse.json({ error: 'Keine Berechtigung für dieses Projekt' }, { status: 403 });
      }
    }

    // Check if location already exists
    const existingLocation = await prisma.locations.findUnique({
      where: { name: locationName.trim() }
    });

    if (existingLocation) {
      return NextResponse.json({ 
        error: 'Location already exists',
        location: existingLocation
      }, { status: 409 });
    }

    // Geocode the location
    const geocodingResult = await geocodingService.geocode(locationName);

    // Create location record
    const location = await prisma.locations.create({
      data: {
        name: locationName.trim(),
        normalized: locationName.trim().toLowerCase(),
        country: geocodingResult?.country || null,
        region: geocodingResult?.region || null,
        city: geocodingResult?.city || null,
        latitude: geocodingResult ? new Prisma.Decimal(geocodingResult.latitude) : null,
        longitude: geocodingResult ? new Prisma.Decimal(geocodingResult.longitude) : null,
        geocoded_at: geocodingResult ? new Date() : null
      }
    });

    return NextResponse.json({ 
      success: true, 
      location,
      geocoded: !!geocodingResult
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json({ 
      error: 'Failed to create location',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId') || '';
  const search = searchParams.get('search') || '';
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    // Get user's accessible project IDs
    const userProjectIds = await getUserProjectIds(user.id);
    
    // Validate project access if projectId is provided
    if (projectId && !userProjectIds.includes(projectId)) {
      return NextResponse.json({ error: 'Keine Berechtigung für dieses Projekt' }, { status: 403 });
    }

    // Build where clause
    let whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { region: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get locations with usage counts
    const locations = await prisma.locations.findMany({
      where: whereClause,
      take: limit,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            events: true,
            birth_persons: true,
            death_persons: true
          }
        }
      }
    });

    // Transform results to include usage counts
    const transformedLocations = locations.map(loc => ({
      id: loc.id,
      name: loc.name,
      normalized: loc.normalized,
      country: loc.country,
      region: loc.region,
      city: loc.city,
      latitude: loc.latitude,
      longitude: loc.longitude,
      geocoded_at: loc.geocoded_at,
      created_at: loc.created_at,
      updated_at: loc.updated_at,
      usage: {
        events: loc._count.events,
        birthPersons: loc._count.birth_persons,
        deathPersons: loc._count.death_persons,
        total: loc._count.events + loc._count.birth_persons + loc._count.death_persons
      }
    }));

    return NextResponse.json({ locations: transformedLocations });

  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch locations',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const user = await requireUser();

  try {
    const { id, name, country, region, city, latitude, longitude } = await req.json();

    if (!id || !name) {
      return NextResponse.json({ error: 'Location ID and name are required' }, { status: 400 });
    }

    // Check if location exists
    const existingLocation = await prisma.locations.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingLocation) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    // Check for name conflicts
    const nameConflict = await prisma.locations.findFirst({
      where: {
        name: name.trim(),
        id: { not: parseInt(id) }
      }
    });

    if (nameConflict) {
      return NextResponse.json({ error: 'Location name already exists' }, { status: 409 });
    }

    // Update location
    const updatedLocation = await prisma.locations.update({
      where: { id: parseInt(id) },
      data: {
        name: name.trim(),
        normalized: name.trim().toLowerCase(),
        country: country || null,
        region: region || null,
        city: city || null,
        latitude: latitude ? new Prisma.Decimal(latitude) : null,
        longitude: longitude ? new Prisma.Decimal(longitude) : null,
        geocoded_at: (latitude && longitude) ? new Date() : null
      }
    });

    return NextResponse.json({ 
      success: true, 
      location: updatedLocation
    });

  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json({ 
      error: 'Failed to update location',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
} 