// app/api/import-persons/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';
import { requireUser, getOrCreateLocalUser } from '../../../lib/auth/requireUser';
import { parseFuzzyDate, normalizePlaceName, DateUncertainty, detectPersonDuplicates } from '../../../lib/utils/fuzzyData';

const prisma = new PrismaClient();

function validatePerson(person: any): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!person.first_name?.trim() && !person.last_name?.trim()) {
    errors.push('Mindestens Vor- oder Nachname ist erforderlich');
  }

  // Date validation with fuzzy handling
  if (person.birth_date) {
    const fuzzyDate = parseFuzzyDate(person.birth_date);
    if (!fuzzyDate.date && fuzzyDate.uncertainty === DateUncertainty.UNKNOWN) {
      errors.push('Ungültiges Geburtsdatum');
    } else if (fuzzyDate.uncertainty !== DateUncertainty.EXACT) {
      warnings.push(`Geburtsdatum unsicher: ${fuzzyDate.original} (${fuzzyDate.uncertainty})`);
    }
  }
  
  if (person.death_date) {
    const fuzzyDate = parseFuzzyDate(person.death_date);
    if (!fuzzyDate.date && fuzzyDate.uncertainty === DateUncertainty.UNKNOWN) {
      errors.push('Ungültiges Sterbedatum');
    } else if (fuzzyDate.uncertainty !== DateUncertainty.EXACT) {
      warnings.push(`Sterbedatum unsicher: ${fuzzyDate.original} (${fuzzyDate.uncertainty})`);
    }
  }

  // Logical validation
  if (person.birth_date && person.death_date) {
    const birthDate = parseFuzzyDate(person.birth_date);
    const deathDate = parseFuzzyDate(person.death_date);
    if (birthDate.date && deathDate.date && birthDate.date > deathDate.date) {
      errors.push('Geburtsdatum kann nicht nach Sterbedatum liegen');
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

    // Get user's default project
    const defaultProject = await prisma.project.findFirst({
      where: { owner_id: localUser.id }
    });

    if (!defaultProject) {
      return NextResponse.json({ 
        success: false,
        error: 'No default project found for user' 
      }, { status: 400 });
    }

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

    // Validate all persons first
    const validationResults = data.map((person, index) => {
      const validation = validatePerson(person);
      return {
        index,
        ...validation,
        person
      };
    });

    const validPersons = validationResults.filter(r => r.isValid);
    const invalidPersons = validationResults.filter(r => !r.isValid);

    if (validPersons.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: 'No valid persons found for import',
        details: invalidPersons.map(e => ({
          index: e.index,
          errors: e.errors,
          warnings: e.warnings
        }))
      }, { status: 400 });
    }

    // Get existing persons for duplicate detection
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

    // Import valid persons with fuzzy data handling
    const importResults = [];
    const errors = [];
    const skipped = [];
    const duplicates = [];

    for (const validationResult of validPersons) {
      try {
        const person = validationResult.person;
        
        // Check for duplicates before importing
        const duplicateMatches = detectPersonDuplicates(person, existingPersons, 0.7);
        if (duplicateMatches.length > 0) {
          // Skip this person and record as duplicate
          skipped.push({
            index: validationResult.index,
            reason: 'duplicate_detected',
            matches: duplicateMatches
          });
          duplicates.push(...duplicateMatches);
          continue;
        }
        
        // Process fuzzy dates
        const birthDate = person.birth_date ? parseFuzzyDate(person.birth_date) : null;
        const deathDate = person.death_date ? parseFuzzyDate(person.death_date) : null;
        
        // Process location normalization
        const birthPlace = person.birth_place ? normalizePlaceName(person.birth_place) : null;
        const deathPlace = person.death_place ? normalizePlaceName(person.death_place) : null;

        const personData = {
          userId: localUser.id,
          first_name: person.first_name?.trim() || '',
          last_name: person.last_name?.trim() || '',
          birth_date: birthDate?.date || null,
          birth_date_original: birthDate?.original || null,
          birth_date_uncertainty: birthDate?.uncertainty || null,
          birth_place: birthPlace?.normalized || person.birth_place?.trim() || null,
          birth_place_normalized: birthPlace?.normalized || null,
          birth_place_confidence: birthPlace?.confidence || null,
          death_date: deathDate?.date || null,
          death_date_original: deathDate?.original || null,
          death_date_uncertainty: deathDate?.uncertainty || null,
          death_place: deathPlace?.normalized || person.death_place?.trim() || null,
          death_place_normalized: deathPlace?.normalized || null,
          death_place_confidence: deathPlace?.confidence || null,
          notes: person.notes?.trim() || null,
          name_confidence: 1.0, // Assuming exact match for imported data
          import_batch_id: `import_${Date.now()}`,
          created_via_import: true,
          project_id: defaultProject.id, // Associate with default project
        };

        const createdPerson = await prisma.persons.create({
          data: personData
        });

        importResults.push(createdPerson);

      } catch (error) {
        console.error('Error importing person:', error);
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
          import_type: 'persons',
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
      message: `Successfully imported ${importResults.length} persons`
    });

  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
