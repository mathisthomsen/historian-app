import { NextRequest, NextResponse } from 'next/server';
import { geocodingService } from '@/app/lib/services/geocoding';
import prisma from '@/app/lib/database/prisma';
import { requireUser } from '@/app/lib/auth/requireUser';

// POST - Geocode a location and optionally save it to the database
export async function POST(req: NextRequest) {
  const user = await requireUser();
  
  try {
    const { locationName, saveToDatabase = false } = await req.json();
    
    if (!locationName || typeof locationName !== 'string') {
      return NextResponse.json({ error: 'Location name is required' }, { status: 400 });
    }

    // Geocode the location
    const geocodingResult = await geocodingService.geocode(locationName);
    
    if (!geocodingResult) {
      return NextResponse.json({ 
        error: 'Location not found',
        message: 'Could not find coordinates for this location'
      }, { status: 404 });
    }

    let locationRecord = null;
    
    // Optionally save to database
    if (saveToDatabase) {
      try {
        locationRecord = await prisma.locations.create({
          data: {
            name: locationName,
            normalized: geocodingResult.city || geocodingResult.region || geocodingResult.country || locationName,
            country: geocodingResult.country,
            region: geocodingResult.region,
            city: geocodingResult.city,
            latitude: geocodingResult.latitude,
            longitude: geocodingResult.longitude,
            geocoded_at: new Date().toISOString(),
          }
        });
      } catch (dbError) {
        console.error('Error saving location to database:', dbError);
        // Continue without saving to database
      }
    }

    return NextResponse.json({
      success: true,
      location: {
        name: locationName,
        latitude: geocodingResult.latitude,
        longitude: geocodingResult.longitude,
        country: geocodingResult.country,
        region: geocodingResult.region,
        city: geocodingResult.city,
        id: locationRecord?.id
      }
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json({ 
      error: 'Geocoding failed',
      message: 'An error occurred while geocoding the location'
    }, { status: 500 });
  }
}

// GET - Search for locations
export async function GET(req: NextRequest) {
  const user = await requireUser();
  
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    
    if (!query || query.length < 2) {
      return NextResponse.json({ locations: [] });
    }

    const results = await geocodingService.searchLocations(query);
    
    return NextResponse.json({
      success: true,
      locations: results.map(result => ({
        display_name: result.display_name,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        country: result.address?.country,
        region: result.address?.state,
        city: result.address?.city || result.address?.town || result.address?.village,
        importance: result.importance
      }))
    });
  } catch (error) {
    console.error('Location search error:', error);
    return NextResponse.json({ 
      error: 'Search failed',
      message: 'An error occurred while searching for locations'
    }, { status: 500 });
  }
}
