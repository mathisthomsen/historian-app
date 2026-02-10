import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { requireUser, getOrCreateLocalUser } from '../../../lib/auth/requireUser';
import { detectPersonDuplicates, calculateNameSimilarity } from '../../../lib/utils/fuzzyData';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const localUser = await getOrCreateLocalUser(user);

    const data = await req.json();
    const { type, data: recordData, threshold = 0.8 } = data;

    if (!type || !recordData) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing required fields: type and data' 
      }, { status: 400 });
    }

    let duplicates: any[] = [];

    if (type === 'person') {
      // Get existing persons for comparison
      const existingPersons = await prisma.persons.findMany({
        where: { userId: localUser.id },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          birth_date: true,
          birth_place: true,
          death_date: true,
          death_place: true
        }
      });

      // Detect duplicates
      const matches = detectPersonDuplicates(recordData, existingPersons, threshold);

      // Create duplicate records
      for (const match of matches) {
        const duplicateRecord = await prisma.duplicate_matches.create({
          data: {
            userId: localUser.id,
            table_name: 'persons',
            record_id: recordData.id || 0, // For new records, this might be 0
            duplicate_id: match.person.id,
            confidence: match.confidence,
            match_reason: match.reason,
            status: 'pending'
          }
        });

        duplicates.push({
          ...duplicateRecord,
          matchedPerson: match.person
        });
      }

    } else if (type === 'event') {
      // Get existing events for comparison
      const existingEvents = await prisma.events.findMany({
        where: { userId: localUser.id },
        select: {
          id: true,
          title: true,
          date: true,
          location: true,
          description: true
        }
      });

      // Simple event duplicate detection
      for (const existing of existingEvents) {
        let confidence = 0;
        let reason = '';

        // Title similarity
        if (recordData.title && existing.title) {
          const titleSimilarity = calculateNameSimilarity(recordData.title, existing.title);
          if (titleSimilarity > 0.8) {
            confidence = titleSimilarity;
            reason = 'title_similarity';
          }
        }

        // Date and location matching
        if (recordData.date && existing.date) {
          const dateDiff = Math.abs(new Date(recordData.date).getTime() - existing.date.getTime());
          if (dateDiff < 24 * 60 * 60 * 1000) { // Within 1 day
            if (recordData.location && existing.location) {
              const locationSimilarity = calculateNameSimilarity(recordData.location, existing.location);
              if (locationSimilarity > 0.7) {
                confidence = Math.max(confidence, locationSimilarity);
                reason = 'date_location_match';
              }
            }
          }
        }

        if (confidence >= threshold) {
          const duplicateRecord = await prisma.duplicate_matches.create({
            data: {
              userId: localUser.id,
              table_name: 'events',
              record_id: recordData.id || 0,
              duplicate_id: existing.id,
              confidence,
              match_reason: reason,
              status: 'pending'
            }
          });

          duplicates.push({
            ...duplicateRecord,
            matchedEvent: existing
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        duplicates,
        count: duplicates.length,
        threshold
      }
    });

  } catch (error) {
    console.error('Error detecting duplicates:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to detect duplicates' 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const localUser = await getOrCreateLocalUser(user);

    const { searchParams } = new URL(req.url);
    const tableName = searchParams.get('table');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      userId: localUser.id
    };

    if (tableName) {
      where.table_name = tableName;
    }

    if (status) {
      where.status = status;
    }

    const duplicates = await prisma.duplicate_matches.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    const total = await prisma.duplicate_matches.count({ where });

    return NextResponse.json({
      success: true,
      data: {
        duplicates,
        total,
        stats: {
          pending: await prisma.duplicate_matches.count({ 
            where: { ...where, status: 'pending' } 
          }),
          resolved: await prisma.duplicate_matches.count({ 
            where: { ...where, status: 'resolved' } 
          }),
          ignored: await prisma.duplicate_matches.count({ 
            where: { ...where, status: 'ignored' } 
          })
        }
      }
    });

  } catch (error) {
    console.error('Error fetching duplicates:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch duplicates' 
    }, { status: 500 });
  }
} 