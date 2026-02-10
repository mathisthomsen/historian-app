import { z } from 'zod';

// Types for fuzzy data handling
export enum DateUncertainty {
  EXACT = 'exact',
  APPROXIMATE = 'approximate',
  ESTIMATED = 'estimated',
  UNKNOWN = 'unknown'
}

export enum UncertaintyType {
  DATE = 'date',
  PLACE = 'place',
  NAME = 'name',
  GENERAL = 'general'
}

export interface FuzzyDate {
  date: Date | null;
  original: string;
  uncertainty: DateUncertainty;
  confidence: number;
}

export interface FuzzyPlace {
  original: string;
  normalized: string;
  confidence: number;
  alternatives: string[];
  coordinates?: { lat: number; lng: number };
}

export interface FuzzyName {
  original: string;
  normalized: string;
  confidence: number;
  alternatives: string[];
}

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  warnings: string[];
  suggestions: string[];
  uncertainty: DateUncertainty;
  fuzzyData: {
    dates: FuzzyDate[];
    places: FuzzyPlace[];
    names: FuzzyName[];
  };
}

// Enhanced date parsing with uncertainty detection
export function parseFuzzyDate(input: string): FuzzyDate {
  if (!input || typeof input !== 'string') {
    return {
      date: null,
      original: input || '',
      uncertainty: DateUncertainty.UNKNOWN,
      confidence: 0
    };
  }

  const trimmed = input.trim();
  
  // Handle year only
  if (/^\d{4}$/.test(trimmed)) {
    return {
      date: new Date(`${trimmed}-01-01`),
      original: trimmed,
      uncertainty: DateUncertainty.APPROXIMATE,
      confidence: 0.8
    };
  }

  // Handle year with question mark
  if (/^\d{4}\?$/.test(trimmed)) {
    return {
      date: new Date(`${trimmed.slice(0, -1)}-01-01`),
      original: trimmed,
      uncertainty: DateUncertainty.ESTIMATED,
      confidence: 0.6
    };
  }

  // Handle circa dates
  if (/^c\.?\s*\d{4}$/i.test(trimmed)) {
    const year = trimmed.match(/\d{4}/)?.[0];
    return {
      date: year ? new Date(`${year}-01-01`) : null,
      original: trimmed,
      uncertainty: DateUncertainty.APPROXIMATE,
      confidence: 0.7
    };
  }

  // Handle date ranges
  const rangeMatch = trimmed.match(/^(\d{4})-(\d{4})$/);
  if (rangeMatch) {
    const [_, startYear, endYear] = rangeMatch;
    return {
      date: new Date(`${startYear}-01-01`),
      original: trimmed,
      uncertainty: DateUncertainty.APPROXIMATE,
      confidence: 0.7
    };
  }

  // Handle seasonal dates
  const seasonalMatch = trimmed.match(/^(Spring|Summer|Fall|Autumn|Winter)\s+(\d{4})$/i);
  if (seasonalMatch) {
    const [_, season, year] = seasonalMatch;
    let month = 1;
    switch (season.toLowerCase()) {
      case 'spring': month = 3; break;
      case 'summer': month = 6; break;
      case 'fall':
      case 'autumn': month = 9; break;
      case 'winter': month = 12; break;
    }
    return {
      date: new Date(`${year}-${month.toString().padStart(2, '0')}-01`),
      original: trimmed,
      uncertainty: DateUncertainty.APPROXIMATE,
      confidence: 0.8
    };
  }

  // Handle before/after dates
  if (/^before\s+(\d{4})$/i.test(trimmed)) {
    const year = trimmed.match(/\d{4}/)?.[0];
    return {
      date: year ? new Date(`${year}-12-31`) : null,
      original: trimmed,
      uncertainty: DateUncertainty.ESTIMATED,
      confidence: 0.5
    };
  }

  if (/^after\s+(\d{4})$/i.test(trimmed)) {
    const year = trimmed.match(/\d{4}/)?.[0];
    return {
      date: year ? new Date(`${year}-01-01`) : null,
      original: trimmed,
      uncertainty: DateUncertainty.ESTIMATED,
      confidence: 0.5
    };
  }

  // Handle standard date formats
  const standardDate = new Date(trimmed);
  if (!isNaN(standardDate.getTime())) {
    return {
      date: standardDate,
      original: trimmed,
      uncertainty: DateUncertainty.EXACT,
      confidence: 1.0
    };
  }

  // Handle DD/MM/YYYY format
  const ddmmMatch = trimmed.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (ddmmMatch) {
    const [_, day, month, year] = ddmmMatch;
    const formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const parsed = new Date(formatted);
    if (!isNaN(parsed.getTime())) {
      return {
        date: parsed,
        original: trimmed,
        uncertainty: DateUncertainty.EXACT,
        confidence: 1.0
      };
    }
  }

  // Unknown format
  return {
    date: null,
    original: trimmed,
    uncertainty: DateUncertainty.UNKNOWN,
    confidence: 0
  };
}

// Place name normalization
export function normalizePlaceName(input: string): FuzzyPlace {
  if (!input || typeof input !== 'string') {
    return {
      original: input || '',
      normalized: '',
      confidence: 0,
      alternatives: []
    };
  }

  const trimmed = input.trim();
  
  // Common abbreviations
  const abbreviations: Record<string, string> = {
    'nyc': 'New York City',
    'la': 'Los Angeles',
    'sf': 'San Francisco',
    'dc': 'Washington DC',
    'uk': 'United Kingdom',
    'usa': 'United States',
    'us': 'United States'
  };

  // Historical name mappings
  const historicalNames: Record<string, string> = {
    'constantinople': 'Istanbul',
    'st. petersburg': 'Saint Petersburg',
    'leningrad': 'Saint Petersburg',
    'petrograd': 'Saint Petersburg',
    'prussia': 'Germany',
    'austria-hungary': 'Austria'
  };

  // Multi-language variations
  const languageVariations: Record<string, string> = {
    'münchen': 'Munich',
    'köln': 'Cologne',
    'nürnberg': 'Nuremberg',
    'frankfurt am main': 'Frankfurt',
    'wien': 'Vienna',
    'roma': 'Rome',
    'firenze': 'Florence',
    'napoli': 'Naples'
  };

  const lowerInput = trimmed.toLowerCase();
  
  // Check abbreviations
  if (abbreviations[lowerInput]) {
    return {
      original: trimmed,
      normalized: abbreviations[lowerInput],
      confidence: 0.9,
      alternatives: [trimmed]
    };
  }

  // Check historical names
  if (historicalNames[lowerInput]) {
    return {
      original: trimmed,
      normalized: historicalNames[lowerInput],
      confidence: 0.8,
      alternatives: [trimmed, historicalNames[lowerInput]]
    };
  }

  // Check language variations
  if (languageVariations[lowerInput]) {
    return {
      original: trimmed,
      normalized: languageVariations[lowerInput],
      confidence: 0.85,
      alternatives: [trimmed, languageVariations[lowerInput]]
    };
  }

  // Basic normalization (capitalize, remove extra spaces)
  const normalized = trimmed
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return {
    original: trimmed,
    normalized: normalized,
    confidence: 1.0,
    alternatives: [trimmed]
  };
}

// Name similarity scoring
export function calculateNameSimilarity(name1: string, name2: string): number {
  if (!name1 || !name2) return 0;

  const normalize = (name: string) => name.toLowerCase().trim();
  const n1 = normalize(name1);
  const n2 = normalize(name2);

  // Exact match
  if (n1 === n2) return 1.0;

  // Common nicknames mapping
  const nicknames: Record<string, string[]> = {
    'william': ['bill', 'will', 'billy', 'willy'],
    'robert': ['bob', 'rob', 'robby'],
    'richard': ['rick', 'dick', 'richie'],
    'elizabeth': ['liz', 'beth', 'lizzy', 'betty'],
    'margaret': ['maggie', 'meg', 'peggy'],
    'james': ['jim', 'jimmy', 'jamie'],
    'michael': ['mike', 'mikey', 'mick'],
    'david': ['dave', 'davey'],
    'christopher': ['chris', 'topher'],
    'matthew': ['matt', 'matty'],
    'jennifer': ['jen', 'jenny'],
    'jessica': ['jess', 'jessie'],
    'nicholas': ['nick', 'nicky'],
    'daniel': ['dan', 'danny'],
    'andrew': ['andy', 'drew']
  };

  // Check for nickname matches
  for (const [full, nicks] of Object.entries(nicknames)) {
    if ((n1 === full && nicks.includes(n2)) || (n2 === full && nicks.includes(n1))) {
      return 0.9;
    }
  }

  // Levenshtein distance for fuzzy matching
  const distance = levenshteinDistance(n1, n2);
  const maxLength = Math.max(n1.length, n2.length);
  const similarity = 1 - (distance / maxLength);

  return Math.max(0, similarity);
}

// Levenshtein distance implementation
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

// Duplicate detection for persons
export function detectPersonDuplicates(
  newPerson: any,
  existingPersons: any[],
  threshold: number = 0.8
): Array<{ person: any; confidence: number; reason: string }> {
  const matches: Array<{ person: any; confidence: number; reason: string }> = [];

  for (const existing of existingPersons) {
    let maxConfidence = 0;
    let reason = '';

    // Name similarity
    const firstNameSimilarity = calculateNameSimilarity(
      newPerson.first_name || '',
      existing.first_name || ''
    );
    const lastNameSimilarity = calculateNameSimilarity(
      newPerson.last_name || '',
      existing.last_name || ''
    );

    if (firstNameSimilarity > 0.8 && lastNameSimilarity > 0.8) {
      const nameConfidence = (firstNameSimilarity + lastNameSimilarity) / 2;
      if (nameConfidence > maxConfidence) {
        maxConfidence = nameConfidence;
        reason = 'name_similarity';
      }
    }

    // Date and place matching
    if (newPerson.birth_date && existing.birth_date) {
      const newBirth = parseFuzzyDate(newPerson.birth_date);
      const existingBirth = parseFuzzyDate(existing.birth_date);
      
      if (newBirth.date && existingBirth.date) {
        const yearDiff = Math.abs(newBirth.date.getFullYear() - existingBirth.date.getFullYear());
        if (yearDiff <= 2) {
          const dateConfidence = Math.max(0, 1 - (yearDiff / 10));
          if (dateConfidence > maxConfidence) {
            maxConfidence = dateConfidence;
            reason = 'birth_date_match';
          }
        }
      }
    }

    // Place matching
    if (newPerson.birth_place && existing.birth_place) {
      const newPlace = normalizePlaceName(newPerson.birth_place);
      const existingPlace = normalizePlaceName(existing.birth_place);
      
      if (newPlace.normalized === existingPlace.normalized) {
        const placeConfidence = 0.9;
        if (placeConfidence > maxConfidence) {
          maxConfidence = placeConfidence;
          reason = 'birth_place_match';
        }
      }
    }

    if (maxConfidence >= threshold) {
      matches.push({
        person: existing,
        confidence: maxConfidence,
        reason
      });
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}

// Enhanced validation with fuzzy data support
export function validateWithFuzzyData(data: any, type: 'person' | 'event'): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    confidence: 1.0,
    warnings: [],
    suggestions: [],
    uncertainty: DateUncertainty.EXACT,
    fuzzyData: {
      dates: [],
      places: [],
      names: []
    }
  };

  if (type === 'person') {
    // Validate and process person data
    if (data.birth_date) {
      const fuzzyDate = parseFuzzyDate(data.birth_date);
      result.fuzzyData.dates.push(fuzzyDate);
      if (fuzzyDate.confidence < 0.5) {
        result.warnings.push('Geburtsdatum ist unsicher');
        result.confidence *= 0.8;
      }
    }

    if (data.death_date) {
      const fuzzyDate = parseFuzzyDate(data.death_date);
      result.fuzzyData.dates.push(fuzzyDate);
      if (fuzzyDate.confidence < 0.5) {
        result.warnings.push('Sterbedatum ist unsicher');
        result.confidence *= 0.8;
      }
    }

    if (data.birth_place) {
      const fuzzyPlace = normalizePlaceName(data.birth_place);
      result.fuzzyData.places.push(fuzzyPlace);
      if (fuzzyPlace.confidence < 0.7) {
        result.warnings.push('Geburtsort könnte ungenau sein');
        result.confidence *= 0.9;
      }
    }

    if (data.death_place) {
      const fuzzyPlace = normalizePlaceName(data.death_place);
      result.fuzzyData.places.push(fuzzyPlace);
      if (fuzzyPlace.confidence < 0.7) {
        result.warnings.push('Sterbeort könnte ungenau sein');
        result.confidence *= 0.9;
      }
    }

    // Name validation
    if (data.first_name || data.last_name) {
      const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
      if (fullName) {
        result.fuzzyData.names.push({
          original: fullName,
          normalized: fullName,
          confidence: 1.0,
          alternatives: []
        });
      }
    }
  } else if (type === 'event') {
    // Validate and process event data
    if (data.date) {
      const fuzzyDate = parseFuzzyDate(data.date);
      result.fuzzyData.dates.push(fuzzyDate);
      if (fuzzyDate.confidence < 0.5) {
        result.warnings.push('Startdatum ist unsicher');
        result.confidence *= 0.8;
      }
    }

    if (data.end_date) {
      const fuzzyDate = parseFuzzyDate(data.end_date);
      result.fuzzyData.dates.push(fuzzyDate);
      if (fuzzyDate.confidence < 0.5) {
        result.warnings.push('Enddatum ist unsicher');
        result.confidence *= 0.8;
      }
    }

    if (data.location) {
      const fuzzyPlace = normalizePlaceName(data.location);
      result.fuzzyData.places.push(fuzzyPlace);
      if (fuzzyPlace.confidence < 0.7) {
        result.warnings.push('Ort könnte ungenau sein');
        result.confidence *= 0.9;
      }
    }
  }

  // Overall validation
  if (result.confidence < 0.5) {
    result.isValid = false;
  }

  return result;
} 