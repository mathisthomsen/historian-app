'use client';

import { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Stack,
  Container,
  Typography,
  Skeleton,
  Alert,
  Chip,
  Box,
  FormHelperText,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useProject } from '../../contexts/ProjectContext';
import { api } from '../../lib';

type SourceData = {
  id?: number;
  title: string;
  url?: string;
  author?: string;
  publication?: string;
  year?: number;
  reliability?: number;
  notes?: string;
};

type Props = {
  mode: 'create' | 'edit';
  sourceId?: number;
  onClose?: () => void;
  onResult?: (result: { success: boolean; message: string; source?: any }) => void;
};

export default function SourceForm({ mode, sourceId, onClose, onResult }: Props) {
  const router = useRouter();
  const { selectedProject } = useProject();
  const [formData, setFormData] = useState<SourceData>({
    title: '',
    url: '',
    author: '',
    publication: '',
    year: undefined,
    reliability: 0.5,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load existing source if in edit mode
  useEffect(() => {
    if (mode === 'edit' && sourceId) {
      setInitialLoading(true);
      fetch(`/api/sources/${sourceId}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError(data.error);
          } else {
            setFormData({
              title: data.title || '',
              url: data.url || '',
              author: data.author || '',
              publication: data.publication || '',
              year: data.year || undefined,
              reliability: data.reliability || 0.5,
              notes: data.notes || '',
            });
          }
        })
        .catch(err => {
          setError('Fehler beim Laden der Quelle');
          console.error('Error loading source:', err);
        })
        .finally(() => setInitialLoading(false));
    } else {
      setInitialLoading(false);
    }
  }, [mode, sourceId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const year = value ? parseInt(value) : undefined;
    setFormData(prev => ({ ...prev, year }));
  };

  const handleReliabilityChange = (_: Event, value: number | number[]) => {
    setFormData(prev => ({ ...prev, reliability: value as number }));
  };

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!formData.title.trim()) {
      errors.push('Titel ist erforderlich');
    }

    if (formData.url && !isValidUrl(formData.url)) {
      errors.push('Ungültige URL');
    }

    if (formData.year && (formData.year < 1000 || formData.year > new Date().getFullYear() + 10)) {
      errors.push('Jahr muss zwischen 1000 und ' + (new Date().getFullYear() + 10) + ' liegen');
    }

    if (formData.reliability !== undefined && (formData.reliability < 0 || formData.reliability > 1)) {
      errors.push('Zuverlässigkeit muss zwischen 0 und 1 liegen');
    }

    return { isValid: errors.length === 0, errors };
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateForm();
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    if (!selectedProject) {
      setError('Bitte wählen Sie ein Projekt aus');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const url = mode === 'edit' ? `/api/sources/${sourceId}` : '/api/sources';
      const method = mode === 'edit' ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          projectId: selectedProject.id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const message = mode === 'create' 
          ? 'Quelle erfolgreich erstellt' 
          : 'Quelle erfolgreich aktualisiert';
        
        if (onResult) {
          onResult({ success: true, message, source: result.source });
        } else {
          router.push('/sources');
        }
      } else {
        setError(result.error || 'Fehler beim Speichern der Quelle');
      }
    } catch (err) {
      console.error('Error saving source:', err);
      setError('Fehler beim Speichern der Quelle');
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="rectangular" height={400} sx={{ mt: 2 }} />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        {mode === 'create' ? 'Neue Quelle erstellen' : 'Quelle bearbeiten'}
      </Typography>

      {!selectedProject && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Bitte wählen Sie ein Projekt aus, um eine Quelle zu erstellen.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <Stack spacing={3}>
          {/* Title */}
          <TextField
            required
            fullWidth
            label="Titel"
            name="title"
            value={formData.title}
            onChange={handleChange}
            helperText="Titel der Quelle (z.B. Buch, Artikel, Dokument)"
          />

          {/* URL */}
          <TextField
            fullWidth
            label="URL"
            name="url"
            value={formData.url}
            onChange={handleChange}
            helperText="Link zur Quelle (optional)"
            InputProps={{
              endAdornment: formData.url && (
                <InputAdornment position="end">
                  <Chip 
                    label={isValidUrl(formData.url) ? "Valid" : "Invalid"} 
                    color={isValidUrl(formData.url) ? "success" : "error"}
                    size="small"
                  />
                </InputAdornment>
              ),
            }}
          />

          {/* Author */}
          <TextField
            fullWidth
            label="Autor"
            name="author"
            value={formData.author}
            onChange={handleChange}
            helperText="Autor der Quelle"
          />

          {/* Publication */}
          <TextField
            fullWidth
            label="Publikation"
            name="publication"
            value={formData.publication}
            onChange={handleChange}
            helperText="Name der Publikation (Zeitschrift, Verlag, etc.)"
          />

          {/* Year */}
          <TextField
            fullWidth
            label="Jahr"
            name="year"
            type="number"
            value={formData.year || ''}
            onChange={handleYearChange}
            helperText="Erscheinungsjahr"
            inputProps={{
              min: 1000,
              max: new Date().getFullYear() + 10,
            }}
          />

          {/* Reliability */}
          <Box>
            <Typography gutterBottom>
              Zuverlässigkeit: {formData.reliability ? Math.round(formData.reliability * 100) : 50}%
            </Typography>
            <Slider
              value={formData.reliability || 0.5}
              onChange={handleReliabilityChange}
              min={0}
              max={1}
              step={0.05}
              marks={[
                { value: 0, label: 'Niedrig' },
                { value: 0.5, label: 'Mittel' },
                { value: 1, label: 'Hoch' },
              ]}
              valueLabelDisplay="auto"
            />
            <FormHelperText>
              Bewerten Sie die Zuverlässigkeit und Qualität dieser Quelle
            </FormHelperText>
          </Box>

          {/* Notes */}
          <TextField
            fullWidth
            label="Notizen"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            multiline
            rows={4}
            helperText="Zusätzliche Informationen zur Quelle"
          />

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            {onClose && (
              <Button
                variant="outlined"
                onClick={onClose}
                disabled={submitting}
              >
                Abbrechen
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              disabled={submitting || !selectedProject}
            >
              {submitting ? 'Speichern...' : (mode === 'create' ? 'Erstellen' : 'Aktualisieren')}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Container>
  );
} 