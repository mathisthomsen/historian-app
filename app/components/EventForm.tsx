'use client';

import { useEffect, useState } from 'react';
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
  FormHelperText
} from '@mui/material';
import { useRouter } from 'next/navigation';

type EventData = {
  id?: number;
  title: string;
  date: string;
  end_date: string | null;
  location: string;
  description: string;
};

type DuplicateMatch = {
  id: number;
  title: string;
  date: string;
  location: string;
  confidence: number;
  reason: string;
};

type Props = {
  mode: 'create' | 'edit';
  eventId?: number;
  parentId?: number;
  onClose?: () => void;
  onResult?: (result: { success: boolean; message: string }) => void;
};

export default function EventForm({ mode, eventId, parentId, onClose, onResult }: Props) {
  const router = useRouter();
  const [formData, setFormData] = useState<EventData>({
    title: '',
    date: '',
    end_date: '',
    location: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [showDuplicates, setShowDuplicates] = useState(false);

  // 🧠 Bestehendes Event laden, falls Edit-Modus
  useEffect(() => {
    if (mode === 'edit' && eventId) {
      setInitialLoading(true);
      fetch(`/api/events/${eventId}`)
        .then(res => res.json())
        .then(data => {
          setFormData({
            title: data.title || '',
            date: data.date?.slice(0, 10) || '',
            end_date: data.end_date?.slice(0, 10) || '',
            location: data.location || '',
            description: data.description || '',
          });
        })
        .finally(() => setInitialLoading(false));
    } else {
      setInitialLoading(false);
    }
  }, [mode, eventId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Check for duplicates when form data changes
  useEffect(() => {
    if (mode === 'create' && formData.title.trim()) {
      const checkDuplicates = async () => {
        try {
          const res = await fetch('/api/duplicates/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              type: 'event',
              data: formData,
              threshold: 0.7
            })
          });
          
          if (res.ok) {
            const result = await res.json();
            if (result.data && result.data.duplicates && result.data.duplicates.length > 0) {
              setDuplicates(result.data.duplicates);
              setShowDuplicates(true);
            } else {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent submission if duplicates are detected
    if (showDuplicates && duplicates.length > 0) {
      if (onResult) onResult({ 
        success: false, 
        message: 'Bitte überprüfen Sie die gefundenen Duplikate bevor Sie fortfahren.' 
      });
      return;
    }
    
    setLoading(true);
    const method = mode === 'create' ? 'POST' : 'PUT';
    const url = mode === 'create' ? '/api/events' : `/api/events/${eventId}`;

    try {
      const body = mode === 'create' && parentId
        ? { ...formData, parentId }
        : formData;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setLoading(false);
      if (res.ok) {
        if (onResult) onResult({ success: true, message: 'Event erfolgreich gespeichert.' });
        if (onClose) onClose();
      } else {
        let msg = 'Fehler beim Speichern.';
        try {
          const data = await res.json();
          if (data && data.error) msg += ` ${data.error}`;
        } catch {}
        if (onResult) onResult({ success: false, message: msg });
      }
    } catch (err: any) {
      setLoading(false);
      if (onResult) onResult({ success: false, message: 'Netzwerkfehler oder Server nicht erreichbar.' });
    }
  };

  if (initialLoading) {
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
          <Skeleton height={120} />
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {mode === 'create' ? 'Neues Event' : 'Event bearbeiten'}
      </Typography>

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          <TextField
            label="Titel *"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            fullWidth
          />

          <TextField
            label="Startdatum"
            name="date"
            value={formData.date}
            onChange={handleChange}
            type="text"
            placeholder="YYYY-MM-DD, YYYY, c. YYYY, YYYY-YYYY"
            helperText="Unterstützt: Vollständige Daten, Jahre, circa, Bereiche"
            fullWidth
          />

          <TextField
            label="Enddatum"
            name="end_date"
            value={formData.end_date || ''}
            onChange={handleChange}
            type="text"
            placeholder="YYYY-MM-DD, YYYY, c. YYYY"
            helperText="Optional - für Events mit Zeitraum"
            fullWidth
          />

          <TextField
            label="Ort"
            name="location"
            value={formData.location}
            onChange={handleChange}
            fullWidth
          />

          <TextField
            label="Beschreibung"
            name="description"
            value={formData.description}
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
                      {dup.title} - {dup.reason}
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
              disabled={loading}
              fullWidth
            >
              {loading ? 'Speichern...' : 'Speichern'}
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
