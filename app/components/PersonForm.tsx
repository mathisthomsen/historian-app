'use client'

import { useState, useEffect } from 'react'
import {
  TextField,
  Button,
  Stack,
  Typography,
  Container,
  Skeleton,
  Snackbar,
  Alert,
  Chip,
  Box,
} from '@mui/material'
import { useRouter } from 'next/navigation'
import SiteHeader from './SiteHeader'

type PersonFormProps = {
  initialData?: {
    first_name: string
    last_name: string
    birth_date?: string
    birth_place?: string
    death_date?: string
    death_place?: string
    notes?: string
  }
  personId?: number // Optional: für Edit-Modus
  onClose?: () => void;
  onResult?: (result: { success: boolean; message: string }) => void;
}

type DuplicateMatch = {
  match_reason: string
  matchedPerson: any
  id: number;
  first_name: string;
  last_name: string;
  birth_date?: string;
  birth_place?: string;
  confidence: number;
  reason: string;
};

export default function PersonForm({ mode, personId, onClose, onResult }: { mode: 'create' | 'edit'; personId?: number; onClose?: () => void; onResult?: (result: { success: boolean; message: string }) => void }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    birth_place: '',
    death_date: '',
    death_place: '',
    notes: '',
  });
  const [loading, setLoading] = useState(mode === 'edit' && !!personId); // loading only for edit
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [showDuplicates, setShowDuplicates] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && personId) {
      setLoading(true);
      fetch(`/api/persons/${personId}`)
        .then(res => res.json())
        .then(person => {
          setFormData({
            first_name: person.first_name ?? '',
            last_name: person.last_name ?? '',
            birth_date: person.birth_date?.slice(0, 10) ?? '',
            birth_place: person.birth_place ?? '',
            death_date: person.death_date?.slice(0, 10) ?? '',
            death_place: person.death_place ?? '',
            notes: person.notes ?? '',
          });
        })
        .finally(() => setLoading(false));
    }
  }, [mode, personId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log('handleChange', name, value);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Check for duplicates when form data changes
  useEffect(() => {
    if (mode === 'create' && (formData.first_name.trim() || formData.last_name.trim())) {
      const checkDuplicates = async () => {
        try {
          const res = await fetch('/api/duplicates/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              type: 'person',
              data: formData,
              threshold: 0.7
            })
          });
          
          if (res.ok) {
            console.log('Response:', res);
            const result = await res.json();
            if (result.data && result.data.duplicates && result.data.duplicates.length > 0) {
              console.log('Duplicates found:', result.data.duplicates);
              setDuplicates(result.data.duplicates);
              setShowDuplicates(true);
            } else {
              console.log('No duplicates found');
              setDuplicates([]);
              setShowDuplicates(false);
            }
          }
        } catch (error) {
          console.error('Error checking duplicates:', error);
        }
      };

      // Debounce duplicate checking
      const timeoutId = setTimeout(checkDuplicates, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [formData, mode]);

  const formatDate = (date: string) => {
    if (!date) return null;
    return new Date(date);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('handleSubmit');
    e.preventDefault();
    console.log('showDuplicates', showDuplicates);
    console.log('duplicates', duplicates);
    // Prevent submission if duplicates are detected
    if (showDuplicates && duplicates.length > 0) {
      setError('Bitte überprüfen Sie die gefundenen Duplikate bevor Sie fortfahren.');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    // Send formData as-is, do not convert dates to Date objects
    const formattedData = { ...formData };
    const url = personId ? `/api/persons/${personId}` : '/api/persons';
    const method = personId ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData),
      });
      if (res.ok) {
        if (onResult) onResult({ success: true, message: 'Person erfolgreich gespeichert.' });
        if (onClose) {
          onClose();
        } else {
          router.push('/persons');
        }
      } else {
        let msg = 'Fehler beim Speichern.';
        try {
          const data = await res.json();
          if (data && data.error) msg += ` ${data.error}`;
        } catch {}
        setError(msg);
      }
    } catch (err: any) {
      setError('Netzwerkfehler oder Server nicht erreichbar.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <Skeleton width={250} />
        </Typography>
        <Stack spacing={3}>
          <Skeleton height={56} />
          <Skeleton height={56} />
          <Skeleton height={56} />
          <Skeleton height={56} />
          <Skeleton height={56} />
          <Skeleton height={56} />
          <Skeleton height={120} />
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {mode === 'create' ? 'Neue Person' : 'Person bearbeiten'}
      </Typography>

      

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <TextField
            label="Vorname *"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            required
            fullWidth
          />

          <TextField
            label="Nachname *"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            required
            fullWidth
          />

          <TextField
            label="Geburtsdatum"
            name="birth_date"
            value={formData.birth_date}
            onChange={handleChange}
            type="text"
            placeholder="YYYY-MM-DD, YYYY, c. YYYY"
            helperText="Unterstützt: Vollständige Daten, Jahre, circa"
            fullWidth
          />

          <TextField
            label="Geburtsort"
            name="birth_place"
            value={formData.birth_place}
            onChange={handleChange}
            fullWidth
          />

          <TextField
            label="Sterbedatum"
            name="death_date"
            value={formData.death_date}
            onChange={handleChange}
            type="text"
            placeholder="YYYY-MM-DD, YYYY, c. YYYY"
            helperText="Optional - für verstorbene Personen"
            fullWidth
          />

          <TextField
            label="Sterbeort"
            name="death_place"
            value={formData.death_place}
            onChange={handleChange}
            fullWidth
          />

          <TextField
            label="Notizen"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            multiline
            rows={4}
            fullWidth
          />

        {showDuplicates && duplicates.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Mögliche Duplikate gefunden:
          </Typography>
          <Stack spacing={1}>
            {duplicates.map((dup, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={`${Math.round(dup.confidence * 100)}%`} 
                  size="small" 
                  color="warning" 
                />
                <Typography variant="body2">
                  {dup.matchedPerson.first_name} {dup.matchedPerson.last_name} - {dup.match_reason}
                </Typography>
              </Box>
            ))}
          </Stack>
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setShowDuplicates(false);
                setDuplicates([]);
              }}
            >
              Trotzdem erstellen
            </Button>
          </Box>
        </Alert>
        )}

          <Stack direction="row" spacing={2}>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              fullWidth
            >
              {submitting ? 'Speichern...' : 'Speichern'}
            </Button>
            <Button
              type="button"
              variant="outlined"
              onClick={onClose}
              fullWidth
            >
              Abbrechen
            </Button>
          </Stack>
        </Stack>
      </form>
    </Container>
  );
}
