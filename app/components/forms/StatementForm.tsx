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
  Box,
  FormHelperText,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useProject } from '../../contexts/ProjectContext';
import { api } from '../../lib';

type StatementData = {
  id?: number;
  content: string;
  confidence?: number;
  source_id?: number;
};

type Source = {
  id: number;
  title: string;
  author?: string;
  year?: number;
  reliability?: number;
};

type Props = {
  mode: 'create' | 'edit';
  statementId?: number;
  onClose?: () => void;
  onResult?: (result: { success: boolean; message: string; statement?: any }) => void;
};

export default function StatementForm({ mode, statementId, onClose, onResult }: Props) {
  const router = useRouter();
  const { selectedProject } = useProject();
  const [formData, setFormData] = useState<StatementData>({
    content: '',
    confidence: 0.75,
    source_id: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);

  // Load existing statement if in edit mode
  useEffect(() => {
    if (mode === 'edit' && statementId) {
      setInitialLoading(true);
      fetch(`/api/statements/${statementId}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setError(data.error);
          } else {
            setFormData({
              content: data.content || '',
              confidence: data.confidence || 0.75,
              source_id: data.source_id || undefined,
            });
            if (data.source) {
              setSelectedSource(data.source);
            }
          }
        })
        .catch(err => {
          setError('Fehler beim Laden der Aussage');
          console.error('Error loading statement:', err);
        })
        .finally(() => setInitialLoading(false));
    } else {
      setInitialLoading(false);
    }
  }, [mode, statementId]);

  // Load available sources
  useEffect(() => {
    if (selectedProject) {
      fetch(`/api/sources?projectId=${selectedProject.id}&limit=100`)
        .then(res => res.json())
        .then(data => {
          if (data.sources) {
            setSources(data.sources);
          }
        })
        .catch(err => {
          console.error('Error loading sources:', err);
        });
    }
  }, [selectedProject]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleConfidenceChange = (_: Event, value: number | number[]) => {
    setFormData(prev => ({ ...prev, confidence: value as number }));
  };

  const handleSourceChange = (_: any, newValue: Source | null) => {
    setSelectedSource(newValue);
    setFormData(prev => ({ 
      ...prev, 
      source_id: newValue ? newValue.id : undefined 
    }));
  };

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!formData.content.trim()) {
      errors.push('Inhalt ist erforderlich');
    }

    if (formData.content.length > 2000) {
      errors.push('Inhalt ist zu lang (max. 2000 Zeichen)');
    }

    if (formData.confidence !== undefined && (formData.confidence < 0 || formData.confidence > 1)) {
      errors.push('Vertrauen muss zwischen 0 und 1 liegen');
    }

    return { isValid: errors.length === 0, errors };
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
      const url = mode === 'edit' ? `/api/statements/${statementId}` : '/api/statements';
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
          ? 'Aussage erfolgreich erstellt' 
          : 'Aussage erfolgreich aktualisiert';
        
        if (onResult) {
          onResult({ success: true, message, statement: result.statement });
        } else {
          router.push('/statements');
        }
      } else {
        setError(result.error || 'Fehler beim Speichern der Aussage');
      }
    } catch (err) {
      console.error('Error saving statement:', err);
      setError('Fehler beim Speichern der Aussage');
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
        {mode === 'create' ? 'Neue Aussage erstellen' : 'Aussage bearbeiten'}
      </Typography>

      {!selectedProject && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Bitte wählen Sie ein Projekt aus, um eine Aussage zu erstellen.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        <Stack spacing={3}>
          {/* Content */}
          <TextField
            required
            fullWidth
            label="Aussage"
            name="content"
            value={formData.content}
            onChange={handleChange}
            multiline
            rows={4}
            helperText={`Faktische Aussage über ein Ereignis oder eine Person (${formData.content.length}/2000 Zeichen)`}
            error={formData.content.length > 2000}
          />

          {/* Source Selection */}
          <Autocomplete
            options={sources}
            getOptionLabel={(option) => `${option.title}${option.author ? ` - ${option.author}` : ''}${option.year ? ` (${option.year})` : ''}`}
            value={selectedSource}
            onChange={handleSourceChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Quelle (optional)"
                helperText="Wählen Sie eine Quelle für diese Aussage"
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props}>
                <Stack>
                  <Typography variant="body1">{option.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {option.author && `${option.author}`}
                    {option.year && ` • ${option.year}`}
                    {option.reliability && ` • Zuverlässigkeit: ${Math.round(option.reliability * 100)}%`}
                  </Typography>
                </Stack>
              </Box>
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.id}
                  label={option.title}
                  size="small"
                />
              ))
            }
          />

          {/* Confidence */}
          <Box>
            <Typography gutterBottom>
              Vertrauen: {formData.confidence ? Math.round(formData.confidence * 100) : 75}%
            </Typography>
            <Slider
              value={formData.confidence || 0.75}
              onChange={handleConfidenceChange}
              min={0}
              max={1}
              step={0.05}
              marks={[
                { value: 0, label: 'Unsicher' },
                { value: 0.5, label: 'Mittel' },
                { value: 1, label: 'Sicher' },
              ]}
              valueLabelDisplay="auto"
            />
            <FormHelperText>
              Wie sicher sind Sie sich bezüglich dieser Aussage?
            </FormHelperText>
          </Box>

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