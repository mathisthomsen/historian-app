'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  TextField,
  Button,
  Stack,
  MenuItem,
  Container,
  Typography,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Skeleton,
} from '@mui/material';

export default function LifeEventForm({
    mode,
    lifeEventId,
    personId,
    onCloseAction,
    onSuccessAction,
    onErrorAction,
  }: {
    mode: 'create' | 'edit';
    personId: number;
    lifeEventId?: number;
    onCloseAction: () => void;
    onSuccessAction: (message: string) => void;
    onErrorAction: (message: string) => void;
  }) {
  const [events, setEvents] = useState<{ id: number; title: string }[]>([]);
  const [form, setForm] = useState({
    title: '',
    start_date: '',
    end_date: '',
    location: '',
    description: '',
    event_id: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [initialLoading, setInitialLoading] = useState(mode === 'edit' && !!lifeEventId);

  const successMessage = mode === 'create' ? 'Event erfolgreich erstellt!' : 'Event erfolgreich aktualisiert!';
  const errorMessage = mode === 'create' ? 'Fehler beim Erstellen des Events' : 'Fehler beim Aktualisieren des Events';
  const title = mode === 'create' ? 'Neues Event anlegen' : 'Event bearbeiten';
  const buttonText = mode === 'create' ? 'Event erstellen' : 'Event aktualisieren';
  const buttonLoadingText = mode === 'create' ? 'Erstelle...' : 'Aktualisiere...';

  // 🟦 Events laden
  useEffect(() => {
    setInitialLoading(true);
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
      })
      .catch((error) => {
        setEvents([]);
      })
      .finally(() => setInitialLoading(false));
  }, []);

  // 🧠 Bestehendes Event laden, falls Edit-Modus
  useEffect(() => {
    if (mode === 'edit' && lifeEventId) {
      setInitialLoading(true);
      fetch(`/api/life-events/${lifeEventId}`)
        .then(res => {
          if (!res.ok) {
            throw new Error(`Fehler beim Laden des Events (${res.status})`);
          }
          return res.json();
        })
        .then(data => {
          setForm({
            title: data.title || '',
            event_id: data.event_id?.toString() || '',
            start_date: data.start_date?.slice(0, 10) || '',
            end_date: data.end_date?.slice(0, 10) || '',
            location: data.location || '',
            description: data.description || '',
          });
        })
        .catch(err => {
          onErrorAction('Das Event konnte nicht geladen werden.');
        })
        .finally(() => setInitialLoading(false));
    }
  }, [mode, lifeEventId, onErrorAction]);
  

  // 🟩 Form absenden
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');

    const method = mode === 'create' ? 'POST' : 'PUT';
    const url = mode === 'create' ? '/api/life-events' : `/api/life-events/${lifeEventId}`;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        person_id: personId,
        event_id: form.event_id ? Number(form.event_id) : null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      }),
    });

    setLoading(false);

    if (res.ok) {
        setSuccess(true);
        setForm({
          title: '',
          start_date: '',
          end_date: '',
          location: '',
          description: '',
          event_id: '',
        });
        handleReset();
        onSuccessAction(successMessage);
        onCloseAction();
      } else {
        const { error } = await res.json();
        const msg = error || errorMessage;
        setError(msg);
        onErrorAction(msg);
      }
      
  }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | { name?: string; value: unknown }>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name as string]: value }));
    }

    const handleSelectChange = (e: SelectChangeEvent<string>) => {
        const { name, value } = e.target;
        if (name && typeof value === 'string') {
            setForm(prev => ({ ...prev, [name]: value }));
        } else {
            console.warn('Invalid value or name in handleSelectChange:', { name, value });
        }
    }

    const handleReset = () => {
        setForm({
            title: '',
            start_date: '',
            end_date: '',
            location: '',
            description: '',
            event_id: '',
        });
    }

    if (initialLoading) {
      return (
        <Container maxWidth="sm" sx={{ mt: 6 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            <Skeleton width={250} />
          </Typography>
          <Stack spacing={2} sx={{ maxWidth: 600, mx: 'auto' }}>
            <Skeleton variant="rectangular" height={40} width={180} />
            <Skeleton variant="rectangular" height={56} />
            <Skeleton variant="rectangular" height={56} />
            <Skeleton variant="rectangular" height={56} />
            <Skeleton variant="rectangular" height={56} />
            <Skeleton variant="rectangular" height={100} />
            <Skeleton variant="rectangular" height={56} />
            <Skeleton variant="rectangular" height={40} width={150} />
          </Stack>
        </Container>
      );
    }

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Typography variant="h4" component="h1" gutterBottom>
            {title}
        </Typography>
       
        <Button
            variant="outlined"
            color="secondary"
            onClick={handleReset}
            sx={{ mb: 2 }}
        >
            Formular zurücksetzen
        </Button>
       
        <form onSubmit={handleSubmit}>
            <Stack spacing={2} sx={{ maxWidth: 600, mx: 'auto' }}>
                <TextField
                name="title"
                label="Titel"
                value={form.title}
                fullWidth
                onChange={handleChange}
                required
                />
                <TextField
                name="start_date"
                label="Startdatum"
                type="date"
                value={form.start_date}
                InputLabelProps={{ shrink: true }}
                fullWidth
                onChange={handleChange}
                required
                />
                <TextField
                name="end_date"
                label="Enddatum"
                type="date"
                value={form.end_date}
                InputLabelProps={{ shrink: true }}
                fullWidth
                onChange={handleChange}
                />
                <TextField
                name="location"
                label="Ort"
                value={form.location}
                fullWidth
                onChange={handleChange}
                />
                <TextField
                name="description"
                label="Beschreibung"
                value={form.description}
                multiline
                rows={3}
                fullWidth
                onChange={handleChange}
                />
                <FormControl fullWidth>
                    <InputLabel>Globales Ereignis</InputLabel>
                    <Select
                        name="event_id"
                        label="Globales Event"
                        value={form.event_id}
                        fullWidth
                        onChange={handleSelectChange}
                        MenuProps={{
                            PaperProps: {
                              style: {
                                zIndex: 1400,
                              },
                            },
                          }}
                    >
                        <MenuItem value="">
                            Kein globales Event verknüpfen
                        </MenuItem>
                        {events.map((ev) => (
                            <MenuItem key={ev.id} value={String(ev.id)}>
                                {ev.title}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
        
                <Button type="submit" variant="contained" color="primary">
                    {loading ? buttonLoadingText : buttonText}
                </Button>
            </Stack>
        </form>
    </Container>
  );
}
