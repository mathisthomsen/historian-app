'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { parseFuzzyDate, normalizePlaceName, DateUncertainty } from '../lib/fuzzyData';

interface BulkEditRecord {
  id: number;
  original: any;
  edited: any;
  hasChanges: boolean;
  validationErrors: string[];
}

interface BulkEditModalProps {
  open: boolean;
  onClose: () => void;
  records: any[];
  type: 'person' | 'event';
  onSave: (updatedRecords: any[]) => Promise<void>;
}

export default function BulkEditModal({
  open,
  onClose,
  records,
  type,
  onSave
}: BulkEditModalProps) {
  const [bulkRecords, setBulkRecords] = useState<BulkEditRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [globalValues, setGlobalValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (open && records.length > 0) {
      const initialRecords = records.map(record => ({
        id: record.id,
        original: { ...record },
        edited: { ...record },
        hasChanges: false,
        validationErrors: []
      }));
      setBulkRecords(initialRecords);
    }
  }, [open, records]);

  const getFieldConfig = () => {
    if (type === 'person') {
      return [
        { key: 'first_name', label: 'Vorname', type: 'text' },
        { key: 'last_name', label: 'Nachname', type: 'text' },
        { key: 'birth_date', label: 'Geburtsdatum', type: 'date' },
        { key: 'birth_place', label: 'Geburtsort', type: 'text' },
        { key: 'death_date', label: 'Sterbedatum', type: 'date' },
        { key: 'death_place', label: 'Sterbeort', type: 'text' },
        { key: 'notes', label: 'Notizen', type: 'textarea' }
      ];
    } else {
      return [
        { key: 'title', label: 'Titel', type: 'text' },
        { key: 'date', label: 'Startdatum', type: 'date' },
        { key: 'end_date', label: 'Enddatum', type: 'date' },
        { key: 'location', label: 'Ort', type: 'text' },
        { key: 'description', label: 'Beschreibung', type: 'textarea' }
      ];
    }
  };

  const handleFieldSelection = (field: string) => {
    setSelectedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const handleGlobalValueChange = (field: string, value: any) => {
    setGlobalValues(prev => ({ ...prev, [field]: value }));
  };

  const applyGlobalChanges = () => {
    setBulkRecords(prev => prev.map(record => {
      const updated = { ...record.edited };
      let hasChanges = false;

      selectedFields.forEach(field => {
        if (globalValues[field] !== undefined) {
          updated[field] = globalValues[field];
          hasChanges = true;
        }
      });

      return {
        ...record,
        edited: updated,
        hasChanges: record.hasChanges || hasChanges
      };
    }));
  };

  const handleRecordChange = (recordId: number, field: string, value: any) => {
    setBulkRecords(prev => prev.map(record => {
      if (record.id === recordId) {
        const updated = { ...record.edited, [field]: value };
        return {
          ...record,
          edited: updated,
          hasChanges: true
        };
      }
      return record;
    }));
  };

  const validateRecord = (record: BulkEditRecord): string[] => {
    const errors: string[] = [];
    const edited = record.edited;

    if (type === 'person') {
      if (!edited.first_name?.trim()) {
        errors.push('Vorname ist erforderlich');
      }
      if (!edited.last_name?.trim()) {
        errors.push('Nachname ist erforderlich');
      }

      // Date validation
      if (edited.birth_date && !parseFuzzyDate(edited.birth_date).date) {
        errors.push('Ungültiges Geburtsdatum');
      }
      if (edited.death_date && !parseFuzzyDate(edited.death_date).date) {
        errors.push('Ungültiges Sterbedatum');
      }

      // Logical validation
      if (edited.birth_date && edited.death_date) {
        const birthDate = parseFuzzyDate(edited.birth_date).date;
        const deathDate = parseFuzzyDate(edited.death_date).date;
        if (birthDate && deathDate && birthDate > deathDate) {
          errors.push('Geburtsdatum kann nicht nach Sterbedatum liegen');
        }
      }
    } else {
      if (!edited.title?.trim()) {
        errors.push('Titel ist erforderlich');
      }

      if (edited.date && !parseFuzzyDate(edited.date).date) {
        errors.push('Ungültiges Startdatum');
      }
      if (edited.end_date && !parseFuzzyDate(edited.end_date).date) {
        errors.push('Ungültiges Enddatum');
      }

      if (edited.date && edited.end_date) {
        const startDate = parseFuzzyDate(edited.date).date;
        const endDate = parseFuzzyDate(edited.end_date).date;
        if (startDate && endDate && startDate > endDate) {
          errors.push('Startdatum kann nicht nach Enddatum liegen');
        }
      }
    }

    return errors;
  };

  const handleSave = async () => {
    setLoading(true);
    setErrors([]);

    try {
      // Validate all records
      const validationErrors: string[] = [];
      const updatedRecords = bulkRecords.map(record => {
        const errors = validateRecord(record);
        if (errors.length > 0) {
          validationErrors.push(`Record ${record.id}: ${errors.join(', ')}`);
        }
        return {
          ...record,
          validationErrors: errors
        };
      });

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setLoading(false);
        return;
      }

      // Filter records with changes
      const changedRecords = updatedRecords
        .filter(record => record.hasChanges)
        .map(record => record.edited);

      if (changedRecords.length === 0) {
        setErrors(['Keine Änderungen zum Speichern']);
        setLoading(false);
        return;
      }

      await onSave(changedRecords);
      onClose();
    } catch (error) {
      setErrors([`Fehler beim Speichern: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`]);
    } finally {
      setLoading(false);
    }
  };

  const fieldConfig = getFieldConfig();
  const changedCount = bulkRecords.filter(r => r.hasChanges).length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <EditIcon />
          <Typography variant="h6">
            Bulk Edit - {type === 'person' ? 'Personen' : 'Events'} ({records.length})
          </Typography>
          {changedCount > 0 && (
            <Chip 
              label={`${changedCount} geändert`} 
              color="primary" 
              size="small" 
            />
          )}
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3}>
          {/* Global Edit Section */}
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Globale Änderungen
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              {fieldConfig.map(field => (
                <Chip
                  key={field.key}
                  label={field.label}
                  onClick={() => handleFieldSelection(field.key)}
                  color={selectedFields.includes(field.key) ? 'primary' : 'default'}
                  variant={selectedFields.includes(field.key) ? 'filled' : 'outlined'}
                />
              ))}
            </Stack>

            {selectedFields.length > 0 && (
              <Stack spacing={2}>
                {selectedFields.map(fieldKey => {
                  const field = fieldConfig.find(f => f.key === fieldKey);
                  if (!field) return null;

                  return (
                    <TextField
                      key={fieldKey}
                      label={field.label}
                      value={globalValues[fieldKey] || ''}
                      onChange={(e) => handleGlobalValueChange(fieldKey, e.target.value)}
                      fullWidth
                      size="small"
                    />
                  );
                })}
                <Button
                  variant="outlined"
                  onClick={applyGlobalChanges}
                  startIcon={<EditIcon />}
                >
                  Globale Änderungen anwenden
                </Button>
              </Stack>
            )}
          </Paper>

          {/* Errors */}
          {errors.length > 0 && (
            <Alert severity="error">
              <Typography variant="body2">
                {errors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </Typography>
            </Alert>
          )}

          {/* Records Table */}
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Status</TableCell>
                  <TableCell>ID</TableCell>
                  {fieldConfig.map(field => (
                    <TableCell key={field.key}>{field.label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {bulkRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {record.hasChanges ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : (
                        <WarningIcon color="disabled" fontSize="small" />
                      )}
                    </TableCell>
                    <TableCell>{record.id}</TableCell>
                    {fieldConfig.map(field => (
                      <TableCell key={field.key}>
                        <TextField
                          value={record.edited[field.key] || ''}
                          onChange={(e) => handleRecordChange(record.id, field.key, e.target.value)}
                          size="small"
                          fullWidth
                          error={record.validationErrors.includes(field.label)}
                          helperText={record.validationErrors.includes(field.label) ? 'Fehler' : ''}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Abbrechen
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || changedCount === 0}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {loading ? 'Speichere...' : `${changedCount} Änderungen speichern`}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 