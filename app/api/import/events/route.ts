// app/api/import-events/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { requireUser, getOrCreateLocalUser } from '../../../lib/requireUser';
import { parseFuzzyDate, normalizePlaceName, DateUncertainty, detectPersonDuplicates, calculateNameSimilarity } from '../../../lib/fuzzyData';

const prisma = new PrismaClient();

function validateEvent(event: any): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!event.title?.trim()) {
    errors.push('Titel ist erforderlich');
  }

  // Date validation with fuzzy handling
  if (event.date) {
    const fuzzyDate = parseFuzzyDate(event.date);
    if (!fuzzyDate.date && fuzzyDate.uncertainty === DateUncertainty.UNKNOWN) {
      errors.push('Ungültiges Startdatum');
    } else if (fuzzyDate.uncertainty !== DateUncertainty.EXACT) {
      warnings.push(`Startdatum unsicher: ${fuzzyDate.original} (${fuzzyDate.uncertainty})`);
    }
  }
  
  if (event.end_date) {
    const fuzzyDate = parseFuzzyDate(event.end_date);
    if (!fuzzyDate.date && fuzzyDate.uncertainty === DateUncertainty.UNKNOWN) {
      errors.push('Ungültiges Enddatum');
    } else if (fuzzyDate.uncertainty !== DateUncertainty.EXACT) {
      warnings.push(`Enddatum unsicher: ${fuzzyDate.original} (${fuzzyDate.uncertainty})`);
    }
  }

  // Logical validation
  if (event.date && event.end_date) {
    const startDate = parseFuzzyDate(event.date);
    const endDate = parseFuzzyDate(event.end_date);
    if (startDate.date && endDate.date && startDate.date > endDate.date) {
      errors.push('Startdatum kann nicht nach Enddatum liegen');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const localUser = await getOrCreateLocalUser(user);

    const data = await req.json();
    
    if (!Array.isArray(data)) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid data format - expected array' 
      }, { status: 400 });
    }

    if (data.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'No data provided for import' 
      }, { status: 400 });
    }

    // Validate all events first
    const validationResults = data.map((event, index) => {
      const validation = validateEvent(event);
      return {
        index,
        ...validation,
        event
      };
    });

    const validEvents = validationResults.filter(r => r.isValid);
    const invalidEvents = validationResults.filter(r => !r.isValid);

    if (validEvents.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'No valid events found for import',
        details: invalidEvents.map(e => ({
          index: e.index,
          errors: e.errors,
          warnings: e.warnings
        }))
      }, { status: 400 });
    }

    // Get existing events for duplicate detection
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

    // Import valid events with fuzzy data handling
    const importResults = [];
    const errors = [];
    const skipped = [];
    const duplicates = [];

    for (const validationResult of validEvents) {
      try {
        const event = validationResult.event;
        
        // Check for duplicates before importing
        let hasDuplicate = false;
        for (const existing of existingEvents) {
          let confidence = 0;
          
          // Title similarity
          if (event.title && existing.title) {
            const titleSimilarity = calculateNameSimilarity(event.title, existing.title);
            if (titleSimilarity > 0.8) {
              confidence = titleSimilarity;
            }
          }

          // Date and location matching
          if (event.date && existing.date) {
            const dateDiff = Math.abs(new Date(event.date).getTime() - existing.date.getTime());
            if (dateDiff < 24 * 60 * 60 * 1000) { // Within 1 day
              if (event.location && existing.location) {
                const locationSimilarity = calculateNameSimilarity(event.location, existing.location);
                if (locationSimilarity > 0.7) {
                  confidence = Math.max(confidence, locationSimilarity);
                }
              }
            }
          }

          if (confidence >= 0.7) {
            hasDuplicate = true;
            skipped.push({
              index: validationResult.index,
              reason: 'duplicate_detected',
              confidence,
              existingEvent: existing
            });
            break;
          }
        }
        
        if (hasDuplicate) {
          continue;
        }
        
        // Process fuzzy dates
        const startDate = event.date ? parseFuzzyDate(event.date) : null;
        const endDate = event.end_date ? parseFuzzyDate(event.end_date) : null;
        
        // Process location normalization
        const location = event.location ? normalizePlaceName(event.location) : null;

        const eventData = {
          userId: localUser.id,
          title: event.title.trim(),
          description: event.description?.trim() || null,
          date: startDate?.date || null,
          date_original: startDate?.original || null,
          date_uncertainty: startDate?.uncertainty || null,
          end_date: endDate?.date || null,
          end_date_original: endDate?.original || null,
          end_date_uncertainty: endDate?.uncertainty || null,
          location: location?.normalized || event.location?.trim() || null,
          location_normalized: location?.normalized || null,
          location_confidence: location?.confidence || null,
          title_confidence: 1.0, // Assuming exact match for imported data
          import_batch_id: `import_${Date.now()}`,
          created_via_import: true,
        };

        const createdEvent = await prisma.events.create({
          data: eventData
        });

        importResults.push(createdEvent);

      } catch (error) {
        console.error('Error importing event:', error);
        errors.push({
          index: validationResult.index,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Record import history
    try {
      await prisma.import_history.create({
        data: {
          userId: localUser.id,
          import_type: 'events',
          batch_id: `import_${Date.now()}`,
          file_name: 'CSV/Excel Import',
          total_records: data.length,
          imported_count: importResults.length,
          error_count: errors.length,
          skipped_count: skipped.length,
          processing_time: 0, // Could be calculated if needed
          status: errors.length === 0 ? 'completed' : 'partial',
          error_details: errors.length > 0 ? { errors } : undefined
        }
      });
    } catch (historyError) {
      console.error('Error recording import history:', historyError);
    }

    return NextResponse.json({
      success: true,
      imported_count: importResults.length,
      error_count: errors.length,
      skipped_count: skipped.length,
      total_count: data.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${importResults.length} events`
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
