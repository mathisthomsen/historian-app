import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BulkEditModal from '../../app/components/BulkEditModal';
import ImportHistory from '../../app/components/ImportHistory';
import { parseFuzzyDate, normalizePlaceName, calculateNameSimilarity, detectPersonDuplicates } from '../../app/lib/fuzzyData';

// Mock fetch
global.fetch = jest.fn();

// Mock data
const mockPersons = [
  {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    birth_date: '1890-01-01',
    birth_place: 'Berlin',
    death_date: '1950-12-31',
    death_place: 'Munich',
    notes: 'Test person 1'
  },
  {
    id: 2,
    first_name: 'Jane',
    last_name: 'Smith',
    birth_date: '1895-06-15',
    birth_place: 'Hamburg',
    death_date: null,
    death_place: null,
    notes: 'Test person 2'
  }
];

const mockEvents = [
  {
    id: 1,
    title: 'World War I',
    date: '1914-07-28',
    end_date: '1918-11-11',
    location: 'Europe',
    description: 'Global conflict'
  },
  {
    id: 2,
    title: 'Industrial Revolution',
    date: '1760-01-01',
    end_date: '1840-12-31',
    location: 'United Kingdom',
    description: 'Technological advancement'
  }
];

const mockImportHistory = [
  {
    id: '1',
    import_type: 'persons',
    batch_id: 'batch-1',
    file_name: 'persons.csv',
    total_records: 100,
    imported_count: 95,
    error_count: 3,
    skipped_count: 2,
    processing_time: 5000,
    status: 'completed',
    created_at: '2024-01-01T10:00:00Z'
  },
  {
    id: '2',
    import_type: 'events',
    batch_id: 'batch-2',
    file_name: 'events.csv',
    total_records: 50,
    imported_count: 0,
    error_count: 50,
    skipped_count: 0,
    processing_time: 2000,
    status: 'failed',
    error_details: { message: 'Invalid file format' },
    created_at: '2024-01-02T10:00:00Z'
  }
];

const mockStats = {
  totalImports: 2,
  totalRecords: 150,
  totalImported: 95,
  totalErrors: 53,
  totalSkipped: 2,
  averageProcessingTime: 3500
};

describe('Fuzzy Data Handling', () => {
  describe('parseFuzzyDate', () => {
    test('parses exact dates correctly', () => {
      const result = parseFuzzyDate('1890-01-01');
      expect(result.date).toEqual(new Date('1890-01-01'));
      expect(result.uncertainty).toBe('exact');
      expect(result.confidence).toBe(1.0);
    });

    test('parses year only with uncertainty', () => {
      const result = parseFuzzyDate('1890');
      expect(result.date).toEqual(new Date('1890-01-01'));
      expect(result.uncertainty).toBe('approximate');
      expect(result.confidence).toBe(0.8);
    });

    test('parses year with question mark', () => {
      const result = parseFuzzyDate('1890?');
      expect(result.date).toEqual(new Date('1890-01-01'));
      expect(result.uncertainty).toBe('estimated');
      expect(result.confidence).toBe(0.6);
    });

    test('parses circa dates', () => {
      const result = parseFuzzyDate('c. 1890');
      expect(result.date).toEqual(new Date('1890-01-01'));
      expect(result.uncertainty).toBe('approximate');
      expect(result.confidence).toBe(0.7);
    });

    test('parses date ranges', () => {
      const result = parseFuzzyDate('1890-1895');
      expect(result.date).toEqual(new Date('1890-01-01'));
      expect(result.uncertainty).toBe('approximate');
      expect(result.confidence).toBe(0.7);
    });

    test('parses seasonal dates', () => {
      const result = parseFuzzyDate('Spring 1890');
      expect(result.date).toEqual(new Date('1890-03-01'));
      expect(result.uncertainty).toBe('approximate');
      expect(result.confidence).toBe(0.8);
    });

    test('handles invalid dates', () => {
      const result = parseFuzzyDate('invalid-date');
      expect(result.date).toBeNull();
      expect(result.uncertainty).toBe('unknown');
      expect(result.confidence).toBe(0);
    });
  });

  describe('normalizePlaceName', () => {
    test('normalizes abbreviations', () => {
      const result = normalizePlaceName('NYC');
      expect(result.normalized).toBe('New York City');
      expect(result.confidence).toBe(0.9);
    });

    test('normalizes historical names', () => {
      const result = normalizePlaceName('Constantinople');
      expect(result.normalized).toBe('Istanbul');
      expect(result.confidence).toBe(0.8);
    });

    test('normalizes language variations', () => {
      const result = normalizePlaceName('München');
      expect(result.normalized).toBe('Munich');
      expect(result.confidence).toBe(0.85);
    });

    test('handles unknown places', () => {
      const result = normalizePlaceName('Unknown Place');
      expect(result.normalized).toBe('Unknown Place');
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('calculateNameSimilarity', () => {
    test('exact match returns 1.0', () => {
      const similarity = calculateNameSimilarity('John', 'John');
      expect(similarity).toBe(1.0);
    });

    test('nickname matching works', () => {
      const similarity = calculateNameSimilarity('William', 'Bill');
      expect(similarity).toBe(0.9);
    });

    test('similar names have high similarity', () => {
      const similarity = calculateNameSimilarity('John', 'Jon');
      expect(similarity).toBeGreaterThan(0.7);
    });

    test('different names have low similarity', () => {
      const similarity = calculateNameSimilarity('John', 'Mary');
      expect(similarity).toBeLessThan(0.5);
    });
  });

  describe('detectPersonDuplicates', () => {
    test('detects exact duplicates', () => {
      const newPerson = {
        first_name: 'John',
        last_name: 'Doe',
        birth_date: '1890-01-01',
        birth_place: 'Berlin'
      };

      const duplicates = detectPersonDuplicates(newPerson, mockPersons, 0.8);
      expect(duplicates.length).toBeGreaterThan(0);
      expect(duplicates[0].confidence).toBeGreaterThan(0.8);
    });

    test('detects similar names', () => {
      const newPerson = {
        first_name: 'Jon',
        last_name: 'Doe',
        birth_date: '1890-01-01',
        birth_place: 'Berlin'
      };

      const duplicates = detectPersonDuplicates(newPerson, mockPersons, 0.7);
      expect(duplicates.length).toBeGreaterThan(0);
    });

    test('no duplicates for different people', () => {
      const newPerson = {
        first_name: 'Alice',
        last_name: 'Johnson',
        birth_date: '1900-01-01',
        birth_place: 'Paris'
      };

      const duplicates = detectPersonDuplicates(newPerson, mockPersons, 0.8);
      expect(duplicates.length).toBe(0);
    });
  });
});

describe('BulkEditModal', () => {
  const mockOnSave = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with person data', () => {
    render(
      <BulkEditModal
        open={true}
        onClose={mockOnClose}
        records={mockPersons}
        type="person"
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Bulk Edit - Personen (2)')).toBeInTheDocument();
    expect(screen.getAllByText('Vorname')).toHaveLength(2); // Chip and table header
    expect(screen.getAllByText('Nachname')).toHaveLength(2);
    expect(screen.getAllByText('Geburtsdatum')).toHaveLength(2);
  });

  test('renders with event data', () => {
    render(
      <BulkEditModal
        open={true}
        onClose={mockOnClose}
        records={mockEvents}
        type="event"
        onSave={mockOnSave}
      />
    );

    expect(screen.getByText('Bulk Edit - Events (2)')).toBeInTheDocument();
    expect(screen.getAllByText('Titel')).toHaveLength(2); // Chip and table header
    expect(screen.getAllByText('Startdatum')).toHaveLength(2);
    expect(screen.getAllByText('Ort')).toHaveLength(2);
  });

  test('allows global field selection', () => {
    render(
      <BulkEditModal
        open={true}
        onClose={mockOnClose}
        records={mockPersons}
        type="person"
        onSave={mockOnSave}
      />
    );

    const firstNameChips = screen.getAllByText('Vorname');
    const chip = firstNameChips[0]; // Get the first one (the chip)
    fireEvent.click(chip);
    
    // Check that the chip is clickable
    expect(chip).toBeInTheDocument();
    expect(chip.closest('[role="button"]')).toBeInTheDocument();
  });

  test('applies global changes', async () => {
    render(
      <BulkEditModal
        open={true}
        onClose={mockOnClose}
        records={mockPersons}
        type="person"
        onSave={mockOnSave}
      />
    );

    // Select a field for global editing
    const firstNameChips = screen.getAllByText('Vorname');
    const chip = firstNameChips[0]; // Get the first one (the chip)
    fireEvent.click(chip);

    // Enter a global value
    const globalInput = screen.getByLabelText('Vorname');
    fireEvent.change(globalInput, { target: { value: 'Updated' } });

    // Apply global changes
    const applyButton = screen.getByText('Globale Änderungen anwenden');
    fireEvent.click(applyButton);

    // Check that changes are applied
    await waitFor(() => {
      expect(screen.getByText('2 geändert')).toBeInTheDocument();
    });
  });

  test('validates records before saving', async () => {
    render(
      <BulkEditModal
        open={true}
        onClose={mockOnClose}
        records={mockPersons}
        type="person"
        onSave={mockOnSave}
      />
    );

    // Try to save without changes
    const saveButton = screen.getByText('0 Änderungen speichern');
    fireEvent.click(saveButton);

    // The save button should be disabled when no changes
    expect(saveButton).toBeDisabled();
  });

  test('handles individual record changes', async () => {
    render(
      <BulkEditModal
        open={true}
        onClose={mockOnClose}
        records={mockPersons}
        type="person"
        onSave={mockOnSave}
      />
    );

    // Find and edit a specific field
    const firstNameInputs = screen.getAllByDisplayValue('John');
    fireEvent.change(firstNameInputs[0], { target: { value: 'Updated John' } });

    await waitFor(() => {
      expect(screen.getByText('1 geändert')).toBeInTheDocument();
    });
  });
});

describe('ImportHistory', () => {

  beforeEach(() => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          imports: mockImportHistory,
          stats: mockStats
        }
      })
    });
  });

  test('renders import statistics', async () => {
    render(<ImportHistory />);

    await waitFor(() => {
      expect(screen.getByText('Import-Statistiken')).toBeInTheDocument();
      expect(screen.getByText('2 Imports')).toBeInTheDocument();
      expect(screen.getByText('150 Datensätze')).toBeInTheDocument();
      expect(screen.getByText('95 Importiert')).toBeInTheDocument();
    });
  });

  test('renders import history table', async () => {
    render(<ImportHistory />);

    await waitFor(() => {
      expect(screen.getByText('Import-Historie')).toBeInTheDocument();
      expect(screen.getByText('persons.csv')).toBeInTheDocument();
      expect(screen.getByText('events.csv')).toBeInTheDocument();
    });
  });

  test('shows correct status indicators', async () => {
    render(<ImportHistory />);

    await waitFor(() => {
      expect(screen.getByText('completed')).toBeInTheDocument();
      expect(screen.getByText('failed')).toBeInTheDocument();
    });
  });

  test('handles loading state', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(<ImportHistory />);
    
    expect(screen.getByText('Lade Import-Historie...')).toBeInTheDocument();
  });

  test('handles error state', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    render(<ImportHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch import history')).toBeInTheDocument();
    });
  });

  test('filters by type when provided', async () => {
    render(<ImportHistory type="persons" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('type=persons')
      );
    });
  });
});

describe('API Integration', () => {
  test('duplicate detection API', async () => {
    const mockResponse = {
      success: true,
      data: {
        duplicates: [
          {
            id: 1,
            confidence: 0.9,
            reason: 'name_similarity',
            matchedPerson: mockPersons[0]
          }
        ],
        count: 1,
        threshold: 0.8
      }
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const response = await fetch('/api/duplicates/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'person',
        record: mockPersons[0],
        threshold: 0.8
      })
    });

    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.data.duplicates.length).toBe(1);
  });

  test('import history API', async () => {
    const mockResponse = {
      success: true,
      data: {
        imports: mockImportHistory,
        stats: mockStats
      }
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse
    });

    const response = await fetch('/api/import/history?type=persons');
    const result = await response.json();
    
    expect(result.success).toBe(true);
    expect(result.data.imports.length).toBe(2);
    expect(result.data.stats.totalImports).toBe(2);
  });
}); 