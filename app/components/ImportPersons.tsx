'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import * as ExcelJS from 'exceljs';
import {
  Box,
  Button,
  Typography,
  Stack,
  Paper,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Snackbar,
  Alert as MuiAlert,
  Card,
  CardContent,
  Divider,
  Link,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

type ParsedPerson = {
  first_name: string;
  last_name: string;
  birth_date?: string;
  death_date?: string;
  birth_place?: string;
  death_place?: string;
  notes?: string;
};

type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

type ImportStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

export default function ImportPersons() {
  const router = useRouter();
  const [parsedData, setParsedData] = useState<ParsedPerson[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [fileName, setFileName] = useState<string>('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  // Validation function
  const validatePerson = (person: ParsedPerson, index: number): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!person.first_name?.trim() && !person.last_name?.trim()) {
      errors.push('Mindestens Vor- oder Nachname ist erforderlich');
    }

    // Date validation with fuzzy handling
    if (person.birth_date) {
      const fuzzyDate = parseFuzzyDate(person.birth_date);
      if (!fuzzyDate.date && fuzzyDate.uncertainty === 'UNKNOWN') {
        errors.push('Ungültiges Geburtsdatum');
      } else if (fuzzyDate.uncertainty !== 'EXACT') {
        warnings.push(`Geburtsdatum unsicher: ${fuzzyDate.original} (${fuzzyDate.uncertainty})`);
      }
    }
    
    if (person.death_date) {
      const fuzzyDate = parseFuzzyDate(person.death_date);
      if (!fuzzyDate.date && fuzzyDate.uncertainty === 'UNKNOWN') {
        errors.push('Ungültiges Sterbedatum');
      } else if (fuzzyDate.uncertainty !== 'EXACT') {
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

    // Warnings
    if (!person.birth_date && !person.death_date) {
      warnings.push('Kein Datum angegeben');
    }
    if (!person.birth_place?.trim() && !person.death_place?.trim()) {
      warnings.push('Kein Ort angegeben');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  // Fuzzy date parsing function
  const parseFuzzyDate = (input: string) => {
    if (!input || typeof input !== 'string') {
      return { date: null, original: input, uncertainty: 'UNKNOWN' as const, confidence: 0 };
    }

    const trimmed = input.trim();
    
    // Exact date formats
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const date = new Date(trimmed);
      if (!isNaN(date.getTime())) {
        return { date, original: input, uncertainty: 'EXACT' as const, confidence: 1.0 };
      }
    }

    // Year only
    if (/^\d{4}$/.test(trimmed)) {
      const year = parseInt(trimmed);
      if (year >= 1000 && year <= 2100) {
        const date = new Date(year, 0, 1);
        return { date, original: input, uncertainty: 'ESTIMATED' as const, confidence: 0.8 };
      }
    }

    // Year with question mark
    if (/^\d{4}\?$/.test(trimmed)) {
      const year = parseInt(trimmed.slice(0, -1));
      if (year >= 1000 && year <= 2100) {
        const date = new Date(year, 0, 1);
        return { date, original: input, uncertainty: 'ESTIMATED' as const, confidence: 0.6 };
      }
    }

    // Circa dates
    const circaMatch = trimmed.match(/^c\.?\s*(\d{4})$/i);
    if (circaMatch) {
      const year = parseInt(circaMatch[1]);
      if (year >= 1000 && year <= 2100) {
        const date = new Date(year, 0, 1);
        return { date, original: input, uncertainty: 'APPROXIMATE' as const, confidence: 0.7 };
      }
    }

    // Date ranges
    const rangeMatch = trimmed.match(/^(\d{4})-(\d{4})$/);
    if (rangeMatch) {
      const startYear = parseInt(rangeMatch[1]);
      const endYear = parseInt(rangeMatch[2]);
      if (startYear >= 1000 && endYear <= 2100 && startYear <= endYear) {
        const date = new Date(startYear, 0, 1);
        return { date, original: input, uncertainty: 'APPROXIMATE' as const, confidence: 0.7 };
      }
    }

    // Try standard date parsing
    const date = new Date(trimmed);
    if (!isNaN(date.getTime())) {
      return { date, original: input, uncertainty: 'EXACT' as const, confidence: 1.0 };
    }

    return { date: null, original: input, uncertainty: 'UNKNOWN' as const, confidence: 0 };
  };

  // File validation
  const validateFile = (file: File): boolean => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    
    if (file.size > maxSize) {
      setSnackbar({
        open: true,
        message: 'Datei ist zu groß. Maximale Größe: 5MB',
        severity: 'error'
      });
      return false;
    }

    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      setSnackbar({
        open: true,
        message: 'Nur CSV und XLSX Dateien sind erlaubt',
        severity: 'error'
      });
      return false;
    }

    return true;
  };

  // Process file
  const processFile = async (file: File) => {
    if (!validateFile(file)) return;

    setImportStatus('processing');
    setFileName(file.name);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let data: ParsedPerson[] = [];

      if (ext === 'csv') {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            data = results.data as ParsedPerson[];
            processData(data);
          },
          error: (error) => {
            throw new Error(`CSV Parsing Error: ${error.message}`);
          }
        });
      } else if (ext === 'xlsx') {
        const workbook = new ExcelJS.Workbook();
        const arrayBuffer = await file.arrayBuffer();
        await workbook.xlsx.load(arrayBuffer);
        
        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
          throw new Error('Keine Arbeitsblätter in der Datei gefunden');
        }

        const headers: string[] = [];
        worksheet.getRow(1).eachCell((cell, colNumber) => {
          headers[colNumber - 1] = cell.value?.toString() || '';
        });

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;
          
          const rowData: any = {};
          row.eachCell((cell, colNumber) => {
            const header = headers[colNumber - 1];
            if (header) {
              rowData[header] = cell.value?.toString() || '';
            }
          });
          
          if (Object.keys(rowData).length > 0) {
            data.push(rowData as ParsedPerson);
          }
        });

        processData(data);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Fehler beim Lesen der Datei: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        severity: 'error'
      });
      setImportStatus('error');
    }
  };

  const processData = (data: ParsedPerson[]) => {
    setParsedData(data);
    const validation = data.map((person, index) => validatePerson(person, index));
    setValidationResults(validation);
    setImportStatus('idle');
  };

  // Handle file drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    e.target.value = '';
  };

  // Download template
  const downloadTemplate = () => {
    const csvContent = 'first_name,last_name,birth_date,death_date,birth_place,death_place,notes\nMax,Mustermann,1990-01-01,,Berlin,,Beispielperson\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'personen_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Handle import
  const handleImport = async () => {
    const validData = parsedData.filter((_, index) => validationResults[index]?.isValid);
    
    if (validData.length === 0) {
      setSnackbar({
        open: true,
        message: 'Keine gültigen Daten zum Importieren gefunden',
        severity: 'warning'
      });
      return;
    }

    setImportStatus('uploading');
    
    try {
      const res = await fetch('/api/import/persons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validData),
      });

      const result = await res.json();

      if (!res.ok) {
        // Show detailed error information
        let errorMessage = result.error || 'Import fehlgeschlagen';
        
        if (result.details && Array.isArray(result.details)) {
          const errorDetails = result.details.map((detail: any) => 
            `Zeile ${detail.index + 1}: ${detail.errors.join(', ')}`
          ).join('; ');
          errorMessage += ` - Details: ${errorDetails}`;
        }
        
        throw new Error(errorMessage);
      }

      // Show success with details
      let successMessage = `${validData.length} Personen erfolgreich importiert`;
      if (result.imported_count !== undefined) {
        successMessage = `${result.imported_count} Personen importiert`;
        if (result.error_count > 0) {
          successMessage += `, ${result.error_count} Fehler`;
        }
        if (result.skipped_count > 0) {
          successMessage += `, ${result.skipped_count} übersprungen`;
        }
      }

      setSnackbar({
        open: true,
        message: successMessage,
        severity: 'success'
      });

      setImportStatus('success');
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/persons');
      }, 2000);

    } catch (error) {
      setSnackbar({
        open: true,
        message: `Import fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        severity: 'error'
      });
      setImportStatus('error');
    }
  };

  const validCount = validationResults.filter(r => r.isValid).length;
  const errorCount = validationResults.filter(r => !r.isValid).length;

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Box>
        <Typography variant="h4" gutterBottom>
          Personen importieren
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Importieren Sie Personen aus einer CSV oder Excel-Datei
        </Typography>
      </Box>

      {/* Template Download */}
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2}>
            <InfoIcon color="primary" />
            <Box>
              <Typography variant="h6">Vorlage herunterladen</Typography>
              <Typography variant="body2" color="text.secondary">
                Laden Sie eine Vorlage herunter, um das richtige Format zu sehen
              </Typography>
            </Box>
            <Button
              startIcon={<DownloadIcon />}
              variant="outlined"
              onClick={downloadTemplate}
            >
              Vorlage herunterladen
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          border: '2px dashed',
          borderColor: 'primary.main',
          backgroundColor: 'background.paper',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'primary.dark',
            backgroundColor: 'action.hover',
          },
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Stack spacing={3} alignItems="center">
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main' }} />
          
          <Box textAlign="center">
            <Typography variant="h6" gutterBottom>
              Datei hier ablegen oder auswählen
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Unterstützte Formate: CSV, XLSX (max. 5MB)
            </Typography>
          </Box>

          <Button
            component="label"
            variant="contained"
            startIcon={<CloudUploadIcon />}
            disabled={importStatus === 'uploading' || importStatus === 'processing'}
          >
            {importStatus === 'uploading' || importStatus === 'processing' 
              ? 'Verarbeite...' 
              : 'Datei auswählen'
            }
            <input
              type="file"
              hidden
              onChange={handleFileSelect}
              accept=".csv,.xlsx"
            />
          </Button>

          {importStatus === 'processing' && (
            <Stack direction="row" spacing={2} alignItems="center">
              <CircularProgress size={20} />
              <Typography variant="body2">Verarbeite Datei...</Typography>
            </Stack>
          )}
        </Stack>
      </Paper>

      {/* File Info */}
      {fileName && (
        <Alert severity="info">
          <Typography variant="body2">
            Datei: <strong>{fileName}</strong> ({parsedData.length} Einträge geladen)
          </Typography>
        </Alert>
      )}

      {/* Validation Summary */}
      {validationResults.length > 0 && (
        <Alert 
          severity={errorCount > 0 ? 'warning' : 'success'}
          action={
            <Stack direction="row" spacing={1}>
              <Chip 
                icon={<CheckCircleIcon />} 
                label={`${validCount} gültig`} 
                color="success" 
                size="small" 
              />
              {errorCount > 0 && (
                <Chip 
                  icon={<ErrorIcon />} 
                  label={`${errorCount} Fehler`} 
                  color="error" 
                  size="small" 
                />
              )}
            </Stack>
          }
        >
          <Typography variant="body2">
            {errorCount > 0 
              ? `${validCount} von ${parsedData.length} Einträgen sind gültig`
              : `Alle ${parsedData.length} Einträge sind gültig`
            }
          </Typography>
        </Alert>
      )}

      {/* Data Preview */}
      {parsedData.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Datenvorschau
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell>Vorname</TableCell>
                    <TableCell>Nachname</TableCell>
                    <TableCell>Geburtsdatum</TableCell>
                    <TableCell>Geburtsort</TableCell>
                    <TableCell>Sterbedatum</TableCell>
                    <TableCell>Sterbeort</TableCell>
                    <TableCell>Notizen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {parsedData.slice(0, 10).map((person, index) => {
                    const validation = validationResults[index];
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          {validation?.isValid ? (
                            <CheckCircleIcon color="success" fontSize="small" />
                          ) : (
                            <ErrorIcon color="error" fontSize="small" />
                          )}
                        </TableCell>
                        <TableCell>{person.first_name || '-'}</TableCell>
                        <TableCell>{person.last_name || '-'}</TableCell>
                        <TableCell>{person.birth_date || '-'}</TableCell>
                        <TableCell>{person.birth_place || '-'}</TableCell>
                        <TableCell>{person.death_date || '-'}</TableCell>
                        <TableCell>{person.death_place || '-'}</TableCell>
                        <TableCell>
                          {person.notes ? (
                            <Tooltip title={person.notes}>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 100 }}>
                                {person.notes}
                              </Typography>
                            </Tooltip>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            {parsedData.length > 10 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Zeige erste 10 von {parsedData.length} Einträgen
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Button */}
      {validCount > 0 && (
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="contained"
            size="large"
            onClick={handleImport}
            disabled={importStatus === 'uploading'}
            startIcon={importStatus === 'uploading' ? <CircularProgress size={20} /> : undefined}
          >
            {importStatus === 'uploading' ? 'Importiere...' : `${validCount} Personen importieren`}
          </Button>
          
          <Button
            variant="outlined"
            onClick={() => {
              setParsedData([]);
              setValidationResults([]);
              setFileName('');
              setImportStatus('idle');
            }}
          >
            Zurücksetzen
          </Button>
        </Stack>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Stack>
  );
}
