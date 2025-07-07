'use client';

import { useEffect, useState } from 'react';
import { TextField, Button, Stack, Container, Typography, Skeleton } from '@mui/material';
import { useRouter } from 'next/navigation';

type EventData = {
  id?: number;
  title: string;
  date: string;
  end_date: string | null;
  location: string;
  description: string;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        <Stack spacing={2} sx={{ maxWidth: 600, mx: 'auto' }}>
          <Skeleton variant="rectangular" height={56} />
          <Skeleton variant="rectangular" height={56} />
          <Skeleton variant="rectangular" height={56} />
          <Skeleton variant="rectangular" height={56} />
          <Skeleton variant="rectangular" height={100} />
          <Skeleton variant="rectangular" height={40} width={150} />
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Typography variant="h4" component="h1" gutterBottom>
            {eventId ? 'Ereignis bearbeiten' : 'Neues Ereignis anlegen'}
        </Typography>
        <form onSubmit={handleSubmit}>
        <Stack spacing={2} sx={{ maxWidth: 600, mx: 'auto' }}>
            <TextField
            name="title"
            label="Titel"
            type="text"
            autoFocus
            value={formData.title}
            onChange={handleChange}
            fullWidth
            required
            />
            <TextField
            name="date"
            label="Datum"
            type="date"
            value={formData.date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
            />
            <TextField
            name="end_date"
            label="Enddatum"
            type="date"
            value={formData.end_date}
            onChange={handleChange}
            InputLabelProps={{ shrink: true }}
            fullWidth
            />
            <TextField
            name="location"
            label="Ort"
            value={formData.location}
            onChange={handleChange}
            fullWidth
            />
            <TextField
            name="description"
            label="Beschreibung"
            value={formData.description}
            onChange={handleChange}
            multiline
            rows={3}
            fullWidth
            />

            <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? 'Speichern...' : mode === 'create' ? 'Event erstellen' : 'Event aktualisieren'}
            </Button>
            <Button variant="outlined" color="secondary" onClick={() => onClose && onClose()} disabled={loading}>
              Abbrechen
            </Button>
        </Stack>
        </form>
    </Container>
  );
}
