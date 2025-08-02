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
    // Simple mock that processes the file content
    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
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
    };
    reader.readAsText(file);
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
      expect(screen.getByRole('button', { name: /vorlage herunterladen/i })).toBeInTheDocument();
      expect(screen.getByText('Datei hier ablegen oder auswählen')).toBeInTheDocument();
    });

    it('shows template download functionality', () => {
      render(<ImportPersons />);
      
      const downloadButton = screen.getByRole('button', { name: /vorlage herunterladen/i });
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

    it('shows file upload interface', () => {
      render(<ImportPersons />);
      
      const uploadButton = screen.getByRole('button', { name: /datei auswählen/i });
      expect(uploadButton).toBeInTheDocument();
      
      const fileInput = screen.getByRole('button', { name: /datei auswählen/i }).querySelector('input');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', '.csv,.xlsx');
    });
  });

  describe('ImportEvents', () => {
    it('renders the import interface correctly', () => {
      render(<ImportEvents />);
      
      expect(screen.getByText('Events importieren')).toBeInTheDocument();
      expect(screen.getByText('Importieren Sie Events aus einer CSV oder Excel-Datei')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /vorlage herunterladen/i })).toBeInTheDocument();
    });

    it('shows file upload interface', () => {
      render(<ImportEvents />);
      
      const uploadButton = screen.getByRole('button', { name: /datei auswählen/i });
      expect(uploadButton).toBeInTheDocument();
      
      const fileInput = screen.getByRole('button', { name: /datei auswählen/i }).querySelector('input');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('accept', '.csv,.xlsx');
    });
  });
}); 