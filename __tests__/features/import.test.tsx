import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImportPersons from '../../app/components/ImportPersons';
import ImportEvents from '../../app/components/ImportEvents';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock fetch
global.fetch = jest.fn();

// Mock Papa Parse
jest.mock('papaparse', () => ({
  parse: jest.fn((file, options) => {
    const content = file.content || '';
    const lines = content.split('\n');
    const headers = lines[0].split(',');
    const data = lines.slice(1).map((line: string) => {
      const values = line.split(',');
      const obj: any = {};
      headers.forEach((header: string, index: number) => {
        obj[header.trim()] = values[index]?.trim() || '';
      });
      return obj;
    });
    options.complete({ data });
  }),
}));

// Mock ExcelJS
jest.mock('exceljs', () => ({
  Workbook: jest.fn().mockImplementation(() => ({
    xlsx: {
      load: jest.fn().mockResolvedValue(undefined),
    },
    getWorksheet: jest.fn().mockReturnValue({
      getRow: jest.fn().mockReturnValue({
        eachCell: jest.fn(),
      }),
      eachRow: jest.fn(),
    }),
  })),
}));

describe('Import Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ImportPersons', () => {
    it('renders the import interface correctly', () => {
      render(<ImportPersons />);
      
      expect(screen.getByText('Personen importieren')).toBeInTheDocument();
      expect(screen.getByText('Importieren Sie Personen aus einer CSV oder Excel-Datei')).toBeInTheDocument();
      expect(screen.getByText('Vorlage herunterladen')).toBeInTheDocument();
      expect(screen.getByText('Datei hier ablegen oder auswählen')).toBeInTheDocument();
    });

    it('shows template download functionality', () => {
      render(<ImportPersons />);
      
      const downloadButton = screen.getByText('Vorlage herunterladen');
      expect(downloadButton).toBeInTheDocument();
      
      // Mock URL.createObjectURL and revokeObjectURL
      const mockCreateObjectURL = jest.fn();
      const mockRevokeObjectURL = jest.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;
      
      fireEvent.click(downloadButton);
      
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalled();
    });

    it('handles file upload and shows validation', async () => {
      render(<ImportPersons />);
      
      const file = new File(
        ['first_name,last_name,birth_date\nMax,Mustermann,1990-01-01'],
        'test.csv',
        { type: 'text/csv' }
      );
      
      const input = screen.getByRole('button', { name: /datei auswählen/i });
      fireEvent.change(input, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText('Datei: test.csv (1 Einträge geladen)')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      await waitFor(() => {
        expect(screen.getByText('Alle 1 Einträge sind gültig')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('shows validation errors for invalid data', async () => {
      render(<ImportPersons />);
      
      const file = new File(
        ['first_name,last_name,birth_date\n,Invalid,invalid-date'],
        'test.csv',
        { type: 'text/csv' }
      );
      
      const input = screen.getByRole('button', { name: /datei auswählen/i });
      fireEvent.change(input, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText('0 von 1 Einträgen sind gültig')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('handles successful import and redirects', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Import completed' }),
      });
      
      render(<ImportPersons />);
      
      const file = new File(
        ['first_name,last_name,birth_date\nMax,Mustermann,1990-01-01'],
        'test.csv',
        { type: 'text/csv' }
      );
      
      const input = screen.getByRole('button', { name: /datei auswählen/i });
      fireEvent.change(input, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText('1 Personen importieren')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      const importButton = screen.getByText('1 Personen importieren');
      fireEvent.click(importButton);
      
      await waitFor(() => {
        expect(screen.getByText('Importiere...')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/persons');
      }, { timeout: 5000 });
    });
  });

  describe('ImportEvents', () => {
    it('renders the import interface correctly', () => {
      render(<ImportEvents />);
      
      expect(screen.getByText('Events importieren')).toBeInTheDocument();
      expect(screen.getByText('Importieren Sie Events aus einer CSV oder Excel-Datei')).toBeInTheDocument();
      expect(screen.getByText('Vorlage herunterladen')).toBeInTheDocument();
    });

    it('handles file upload and shows validation', async () => {
      render(<ImportEvents />);
      
      const file = new File(
        ['title,date,description\nTest Event,2024-01-01,Test Description'],
        'test.csv',
        { type: 'text/csv' }
      );
      
      const input = screen.getByRole('button', { name: /datei auswählen/i });
      fireEvent.change(input, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText('Datei: test.csv (1 Einträge geladen)')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      await waitFor(() => {
        expect(screen.getByText('Alle 1 Einträge sind gültig')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('shows validation errors for invalid data', async () => {
      render(<ImportEvents />);
      
      const file = new File(
        ['title,date,description\n,invalid-date,Test'],
        'test.csv',
        { type: 'text/csv' }
      );
      
      const input = screen.getByRole('button', { name: /datei auswählen/i });
      fireEvent.change(input, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText('0 von 1 Einträgen sind gültig')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('handles successful import and redirects', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Import completed' }),
      });
      
      render(<ImportEvents />);
      
      const file = new File(
        ['title,date,description\nTest Event,2024-01-01,Test Description'],
        'test.csv',
        { type: 'text/csv' }
      );
      
      const input = screen.getByRole('button', { name: /datei auswählen/i });
      fireEvent.change(input, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText('1 Events importieren')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      const importButton = screen.getByText('1 Events importieren');
      fireEvent.click(importButton);
      
      await waitFor(() => {
        expect(screen.getByText('Importiere...')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/events');
      }, { timeout: 5000 });
    });
  });

  describe('Error Handling', () => {
    it('shows error message for invalid file type', async () => {
      render(<ImportPersons />);
      
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      
      const input = screen.getByRole('button', { name: /datei auswählen/i });
      fireEvent.change(input, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText('Nur CSV und XLSX Dateien sind erlaubt')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('shows error message for file too large', async () => {
      render(<ImportPersons />);
      
      // Create a file that appears larger than 5MB
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.csv', { type: 'text/csv' });
      Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });
      
      const input = screen.getByRole('button', { name: /datei auswählen/i });
      fireEvent.change(input, { target: { files: [largeFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('Datei ist zu groß. Maximale Größe: 5MB')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('handles API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      render(<ImportPersons />);
      
      const file = new File(
        ['first_name,last_name\nMax,Mustermann'],
        'test.csv',
        { type: 'text/csv' }
      );
      
      const input = screen.getByRole('button', { name: /datei auswählen/i });
      fireEvent.change(input, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText('1 Personen importieren')).toBeInTheDocument();
      }, { timeout: 3000 });
      
      const importButton = screen.getByText('1 Personen importieren');
      fireEvent.click(importButton);
      
      await waitFor(() => {
        expect(screen.getByText('Import fehlgeschlagen: Network error')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
}); 