'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import {
  TextField,
  Button,
  Stack,
  Container,
  Typography,
  Skeleton,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import React from 'react';

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
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // Async event search state
  const [eventOptions, setEventOptions] = useState<{ id: number; title: string }[]>([]);
  const [eventSearch, setEventSearch] = useState('');
  const [eventPage, setEventPage] = useState(1);
  const [eventHasMore, setEventHasMore] = useState(true);
  const [eventLoading, setEventLoading] = useState(false);
  const [eventTotal, setEventTotal] = useState(0);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const successMessage = mode === 'create' ? 'Event erfolgreich erstellt!' : 'Event erfolgreich aktualisiert!';
  const errorMessage = mode === 'create' ? 'Fehler beim Erstellen des Events' : 'Fehler beim Aktualisieren des Events';
  const title = mode === 'create' ? 'Neues Event anlegen' : 'Event bearbeiten';
  const buttonText = mode === 'create' ? 'Event erstellen' : 'Event aktualisieren';
  const buttonLoadingText = mode === 'create' ? 'Erstelle...' : 'Aktualisiere...';

  // Fetch events from API
  const fetchEvents = async (search = '', page = 1, append = false) => {
    setEventLoading(true);
    try {
      const res = await fetch(`/api/events?search=${encodeURIComponent(search)}&page=${page}&limit=20`);
      const data = await res.json();
      const events = Array.isArray(data.events) ? data.events : Array.isArray(data) ? data : [];
      setEventTotal(data.pagination?.total || 0);
      setEventHasMore((data.pagination?.page || 1) < (data.pagination?.totalPages || 1));
      setEventOptions(prev => append ? [...prev, ...events] : events);
    } finally {
      setEventLoading(false);
    }
  };

  // Initial load and reset on open/search
  useEffect(() => {
    if (mode === 'create' || (mode === 'edit' && !lifeEventId)) {
      setEventPage(1);
      fetchEvents(eventSearch, 1, false);
    }
  }, [eventSearch, mode, lifeEventId]);

  // Load more on page change
  useEffect(() => {
    if (eventPage > 1) {
      fetchEvents(eventSearch, eventPage, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventPage]);

  // Infinite scroll handler
  const handleListboxScroll = (event: React.SyntheticEvent) => {
    const listboxNode = event.currentTarget as HTMLElement;
    if (
      listboxNode.scrollTop + listboxNode.clientHeight >= listboxNode.scrollHeight - 10 &&
      eventHasMore &&
      !eventLoading
    ) {
      setEventPage(prev => prev + 1);
    }
  };

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
        .then(async data => {
          setForm({
            title: data.title || '',
            event_id: data.event_id?.toString() || '',
            start_date: data.start_date?.slice(0, 10) || '',
            end_date: data.end_date?.slice(0, 10) || '',
            location: data.location || '',
            description: data.description || '',
          });
          // Ensure the related event is loaded in eventOptions
          if (data.event_id) {
            const exists = eventOptions.some(ev => ev.id === data.event_id);
            if (!exists) {
              // Try to fetch the event by id and add to options
              const res = await fetch(`/api/events/${data.event_id}`);
              if (res.ok) {
                const event = await res.json();
                setEventOptions(prev => [...prev, event]);
              }
            }
          }
        })
        .catch(err => {
          onErrorAction('Das Event konnte nicht geladen werden.');
        })
        .finally(() => setInitialLoading(false));
    }
  }, [mode, lifeEventId, onErrorAction]);
  

  // Custom validation
  function validateForm() {
    const errors: { [key: string]: string } = {};
    if (!form.title.trim()) {
      errors.title = 'Titel ist erforderlich';
    }
    if (!form.start_date) {
      errors.start_date = 'Startdatum ist erforderlich';
    }
    // Add more validations as needed
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // 🟩 Form absenden
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');
    setFieldErrors({});

    // Custom validation before submit
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const method = mode === 'create' ? 'POST' : 'PUT';
    const url = mode === 'create' ? '/api/life-events' : `/api/life-events/${lifeEventId}`;

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        personId: personId,
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
       
        <form onSubmit={handleSubmit} noValidate>
            <Stack spacing={2} sx={{ maxWidth: 600, mx: 'auto' }}>
                <TextField
                name="title"
                label="Titel"
                value={form.title}
                fullWidth
                onChange={handleChange}
                required
                error={!!fieldErrors.title}
                helperText={fieldErrors.title}
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
                error={!!fieldErrors.start_date}
                helperText={fieldErrors.start_date}
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
                <Autocomplete
                  ref={autocompleteRef}
                  options={eventOptions}
                  getOptionLabel={(option) => option.title}
                  value={eventOptions.find(ev => String(ev.id) === form.event_id) || null}
                  loading={eventLoading}
                  onInputChange={(_, value, reason) => {
                    if (reason === 'input') {
                      setEventSearch(value);
                      setEventPage(1);
                    }
                  }}
                  onChange={(_, newValue) => {
                    setForm(prev => ({ ...prev, event_id: newValue ? String(newValue.id) : '' }));
                  }}
                  ListboxProps={{
                    onScroll: handleListboxScroll
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Globales Ereignis"
                      fullWidth
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {eventLoading ? <CircularProgress color="inherit" size={20} sx={{ mr: 1 }} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option) => {
                    const { key, ...rest } = props;
                    return (
                      <li key={option.id} {...rest}>
                        {option.title}
                      </li>
                    );
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  clearOnBlur
                  noOptionsText="Kein globales Ereignis gefunden"
                />
        
                <Button type="submit" variant="contained" color="primary">
                    {loading ? buttonLoadingText : buttonText}
                </Button>
            </Stack>
        </form>
    </Container>
  );
}
