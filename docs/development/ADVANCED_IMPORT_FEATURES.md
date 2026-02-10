# Advanced Import Features Implementation

## Overview

This document outlines the comprehensive implementation of advanced import features including duplicate detection, fuzzy data handling, import history tracking, and bulk edit capabilities.

## 1. Enhanced Database Schema

### New Tables Added

#### `import_history`
- Tracks all import operations with detailed statistics
- Fields: `id`, `userId`, `import_type`, `batch_id`, `file_name`, `total_records`, `imported_count`, `error_count`, `skipped_count`, `processing_time`, `status`, `error_details`, `created_at`

#### `data_uncertainty`
- Tracks uncertainty levels for fuzzy data
- Fields: `id`, `userId`, `table_name`, `record_id`, `field_name`, `original_value`, `normalized_value`, `confidence`, `uncertainty_type`, `created_at`

#### `duplicate_matches`
- Tracks detected duplicates with confidence scores
- Fields: `id`, `userId`, `table_name`, `record_id`, `duplicate_id`, `confidence`, `match_reason`, `status`, `resolved_action`, `created_at`, `resolved_at`

### Enhanced Existing Tables

#### `persons` Table Additions
- `birth_date_uncertainty`: Date uncertainty level
- `death_date_uncertainty`: Date uncertainty level
- `birth_date_original`: Original date input
- `death_date_original`: Original date input
- `birth_place_normalized`: Normalized place name
- `death_place_normalized`: Normalized place name
- `birth_place_confidence`: Place confidence score
- `death_place_confidence`: Place confidence score
- `name_confidence`: Overall confidence score
- `import_batch_id`: Import tracking
- `created_via_import`: Import flag

#### `events` Table Additions
- `date_uncertainty`: Date uncertainty level
- `end_date_uncertainty`: Date uncertainty level
- `date_original`: Original date input
- `end_date_original`: Original date input
- `location_normalized`: Normalized location
- `location_confidence`: Location confidence score
- `title_confidence`: Title confidence score
- `import_batch_id`: Import tracking
- `created_via_import`: Import flag

## 2. Fuzzy Data Handling (`app/lib/fuzzyData.ts`)

### Date Parsing with Uncertainty

```typescript
interface FuzzyDate {
  date: Date | null;
  original: string;
  uncertainty: DateUncertainty;
  confidence: number;
}
```

#### Supported Date Formats
- **Year only**: "1890" → `1890-01-01` (approximate)
- **Year with question mark**: "1890?" → `1890-01-01` (estimated)
- **Circa dates**: "c. 1890" → `1890-01-01` (approximate)
- **Date ranges**: "1890-1895" → `1890-01-01` (approximate)
- **Seasonal dates**: "Spring 1890" → `1890-03-01` (approximate)
- **Before/After**: "before 1890" → `1890-12-31` (estimated)

#### Uncertainty Levels
- `EXACT`: Full confidence in the date
- `APPROXIMATE`: Reasonable confidence, some uncertainty
- `ESTIMATED`: Low confidence, significant uncertainty
- `UNKNOWN`: No confidence, cannot parse

### Place Name Normalization

```typescript
interface FuzzyPlace {
  original: string;
  normalized: string;
  confidence: number;
  alternatives: string[];
  coordinates?: { lat: number; lng: number };
}
```

#### Normalization Features
- **Abbreviations**: "NYC" → "New York City"
- **Historical names**: "Constantinople" → "Istanbul"
- **Language variations**: "München" → "Munich"
- **Spelling variations**: "Berlyn" → "Berlin"

### Name Similarity Scoring

```typescript
function calculateNameSimilarity(name1: string, name2: string): number
```

#### Features
- **Nickname matching**: "William" ↔ "Bill"
- **Levenshtein distance**: Fuzzy string matching
- **Confidence scoring**: 0.0 to 1.0 scale

### Duplicate Detection

```typescript
function detectPersonDuplicates(
  newPerson: any,
  existingPersons: any[],
  threshold: number = 0.8
): Array<{ person: any; confidence: number; reason: string }>
```

#### Detection Strategies
- **Name similarity**: Compare first and last names
- **Date matching**: Birth/death date comparison
- **Place matching**: Birth/death place comparison
- **Confidence scoring**: Multiple factors combined

## 3. API Endpoints

### Import History API (`/api/import/history`)

#### GET `/api/import/history`
- Fetch import history with statistics
- Supports filtering by type and pagination
- Returns aggregated statistics

#### POST `/api/import/history`
- Create new import history record
- Tracks processing time and results

### Duplicate Detection API (`/api/duplicates/detect`)

#### POST `/api/duplicates/detect`
- Detect duplicates for new records
- Supports both persons and events
- Configurable confidence threshold

#### GET `/api/duplicates/detect`
- Fetch existing duplicate matches
- Filter by table, status, confidence
- Returns statistics

## 4. UI Components

### Bulk Edit Modal (`app/components/BulkEditModal.tsx`)

#### Features
- **Global field editing**: Apply changes to multiple records
- **Individual record editing**: Edit specific records
- **Real-time validation**: Validate changes as you type
- **Fuzzy data support**: Handle uncertain dates and places
- **Change tracking**: Track which records have been modified

#### Usage
```typescript
<BulkEditModal
  open={open}
  onClose={onClose}
  records={selectedRecords}
  type="person"
  onSave={handleBulkSave}
/>
```

### Import History Component (`app/components/ImportHistory.tsx`)

#### Features
- **Import statistics**: Overview of all imports
- **Detailed history**: Table with all import records
- **Status indicators**: Visual status for each import
- **Error details**: View detailed error information
- **Re-run capability**: Retry failed imports

#### Usage
```typescript
<ImportHistory type="persons" />
```

## 5. Enhanced Import Components

### Updated ImportPersons and ImportEvents

#### New Features
- **Fuzzy data validation**: Real-time validation with uncertainty
- **Duplicate detection**: Check for existing records during import
- **Import history tracking**: Log all import operations
- **Enhanced error handling**: Detailed error messages
- **Progress tracking**: Real-time progress updates

#### Validation Enhancements
- **Soft validation**: Allow uncertain data with warnings
- **Confidence scoring**: Rate data quality
- **Alternative suggestions**: Suggest corrections
- **Visual indicators**: Show uncertainty levels

## 6. Implementation Examples

### Duplicate Detection During Import

```typescript
// In ImportPersons component
const handleImport = async () => {
  const validData = parsedData.filter((_, index) => validationResults[index]?.isValid);
  
  // Check for duplicates
  for (const person of validData) {
    const duplicates = await detectDuplicates('person', person);
    if (duplicates.length > 0) {
      // Show duplicate warning
      setDuplicateWarnings(prev => [...prev, { person, duplicates }]);
    }
  }
  
  // Proceed with import
  const result = await importData(validData);
};
```

### Fuzzy Date Handling

```typescript
// Parse uncertain dates
const fuzzyDate = parseFuzzyDate("1890?");
// Returns: { date: 1890-01-01, uncertainty: 'estimated', confidence: 0.6 }

// Store with uncertainty
await prisma.persons.create({
  data: {
    birth_date: fuzzyDate.date,
    birth_date_uncertainty: fuzzyDate.uncertainty,
    birth_date_original: fuzzyDate.original,
    // ... other fields
  }
});
```

### Bulk Edit with Fuzzy Data

```typescript
// Apply global changes to multiple records
const applyGlobalChanges = () => {
  setBulkRecords(prev => prev.map(record => {
    const updated = { ...record.edited };
    
    selectedFields.forEach(field => {
      if (globalValues[field] !== undefined) {
        // Handle fuzzy data
        if (field.includes('date')) {
          const fuzzyDate = parseFuzzyDate(globalValues[field]);
          updated[field] = fuzzyDate.date;
          updated[`${field}_uncertainty`] = fuzzyDate.uncertainty;
          updated[`${field}_original`] = fuzzyDate.original;
        } else if (field.includes('place')) {
          const fuzzyPlace = normalizePlaceName(globalValues[field]);
          updated[field] = fuzzyPlace.normalized;
          updated[`${field}_confidence`] = fuzzyPlace.confidence;
        } else {
          updated[field] = globalValues[field];
        }
      }
    });
    
    return { ...record, edited: updated, hasChanges: true };
  }));
};
```

## 7. Best Practices Implemented

### Data Quality
- **Preserve original data**: Store original inputs alongside normalized values
- **Track uncertainty**: Explicit uncertainty levels for all fuzzy data
- **Confidence scoring**: Quantify data quality
- **Validation feedback**: Clear feedback on data quality

### User Experience
- **Progressive disclosure**: Show information as needed
- **Visual indicators**: Clear visual cues for uncertainty
- **Alternative suggestions**: Help users correct data
- **Graceful degradation**: Handle errors gracefully

### Performance
- **Batch processing**: Process large datasets efficiently
- **Caching**: Cache normalized values and similarity scores
- **Indexing**: Optimize database queries
- **Background processing**: Handle heavy operations asynchronously

## 8. Future Enhancements

### Phase 2 Features
- **Machine learning**: Train models on user corrections
- **Geocoding integration**: Automatic place name resolution
- **Advanced analytics**: Import performance analytics
- **Template management**: Save and share import templates

### Phase 3 Features
- **AI-powered suggestions**: Intelligent data correction
- **Collaborative editing**: Multi-user bulk editing
- **Advanced validation rules**: Custom validation logic
- **Integration APIs**: Connect with external data sources

## 9. Testing Strategy

### Unit Tests
- Fuzzy data parsing functions
- Duplicate detection algorithms
- Validation logic
- API endpoint functionality

### Integration Tests
- End-to-end import workflows
- Database operations
- Error handling scenarios
- Performance testing

### User Acceptance Tests
- Import workflows with fuzzy data
- Duplicate detection accuracy
- Bulk edit functionality
- Import history tracking

## Conclusion

The advanced import features provide a comprehensive solution for handling historical data with its inherent uncertainty and complexity. The implementation balances automation with user control, ensuring data quality while respecting the fuzzy nature of historical information.

Key benefits:
1. **Improved data quality** through fuzzy validation and duplicate detection
2. **Better user experience** with clear feedback and visual indicators
3. **Enhanced productivity** through bulk operations and import history
4. **Scalable architecture** that can handle large datasets efficiently
5. **Future-proof design** that can accommodate new features and requirements 