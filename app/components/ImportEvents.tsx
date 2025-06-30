'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import * as ExcelJS from 'exceljs';
import {
  Button,
  Typography,
  Stack,
  styled,
  Paper,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});


type ParsedEvent = {
  title: string;
  date?: string;
  end_date?: string;
  description?: string;
  location?: string;
};

export default function CsvOrXlsxImporter() {
  const [parsedData, setParsedData] = useState<ParsedEvent[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setParsedData(results.data as ParsedEvent[]);
        },
      });
    } else if (ext === 'xlsx') {
      try {
        const workbook = new ExcelJS.Workbook();
        const arrayBuffer = await file.arrayBuffer();
        await workbook.xlsx.load(arrayBuffer);
        
        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
          alert('Keine Arbeitsblätter in der Datei gefunden.');
          return;
        }

        const jsonData: ParsedEvent[] = [];
        const headers: string[] = [];
        
        // Get headers from first row
        worksheet.getRow(1).eachCell((cell, colNumber) => {
          headers[colNumber - 1] = cell.value?.toString() || '';
        });

        // Process data rows
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header row
          
          const rowData: any = {};
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            if (header) {
              rowData[header] = cell.value?.toString() || '';
            }
          });
          
          if (Object.keys(rowData).length > 0) {
            jsonData.push(rowData as ParsedEvent);
          }
        });

        setParsedData(jsonData);
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        alert('Fehler beim Lesen der Excel-Datei.');
      }
    } else {
      alert('Nur .csv und .xlsx Dateien sind erlaubt.');
    }

    // Reset input value so the same file can be selected again if needed
    e.target.value = '';
  };

  const handleUpload = async () => {
    setUploading(true);
    try {
      const res = await fetch('/api/import/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedData),
      });

      if (!res.ok) throw new Error();

      alert('Import erfolgreich!');
      setParsedData([]);
    } catch {
      alert('Fehler beim Import');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        CSV oder XLSX Datei importieren
      </Typography>

      <Stack spacing={2}>
        <Button
          component="label"
          role={undefined}
          variant="contained"
          tabIndex={-1}
          startIcon={<CloudUploadIcon />}
        >
          Upload files
          <VisuallyHiddenInput
            type="file"
            onChange={handleFileChange}
            accept=".csv, .xlsx"
            aria-label="Datei auswählen"
            aria-describedby="file-upload-instructions"
            multiple
          />
        </Button>

        {parsedData.length > 0 && (
          <>
            <Typography variant="body1">
              {parsedData.length} Einträge geladen.
            </Typography>
            <Button variant="contained" onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Importiere…' : 'Import starten'}
            </Button>
          </>
        )}
      </Stack>
    </Paper>
  );
}
