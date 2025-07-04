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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatDate = (date: string) => {
    if (!date) return null;
    return new Date(date);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        if (onResult) onResult({ success: false, message: msg });
      }
    } catch (err: any) {
      setError('Netzwerkfehler oder Server nicht erreichbar.');
      if (onResult) onResult({ success: false, message: 'Netzwerkfehler oder Server nicht erreichbar.' });
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
        <Stack spacing={2}>
          <Skeleton variant="rectangular" height={56} />
          <Skeleton variant="rectangular" height={56} />
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
      <SiteHeader title={mode === 'edit' ? 'Person bearbeiten' : 'Neue Person'} showOverline={false}/>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2} sx={{ marginBlockEnd: 4 }}>
          <TextField label="Vorname" name="first_name" value={formData.first_name} onChange={handleChange} fullWidth />
          <TextField label="Nachname" name="last_name" value={formData.last_name} onChange={handleChange} fullWidth />
          <TextField label="Geburtsdatum" name="birth_date" type="date" InputLabelProps={{ shrink: true }} value={formData.birth_date} onChange={handleChange} fullWidth />
          <TextField label="Geburtsort" name="birth_place" value={formData.birth_place} onChange={handleChange} fullWidth />
          <TextField label="Sterbedatum" name="death_date" type="date" InputLabelProps={{ shrink: true }} value={formData.death_date} onChange={handleChange} fullWidth />
          <TextField label="Sterbeort" name="death_place" value={formData.death_place} onChange={handleChange} fullWidth />
          <TextField label="Notizen" name="notes" value={formData.notes} onChange={handleChange} multiline rows={3} fullWidth />
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Speichern...' : 'Speichern'}
          </Button>
          <Button variant="outlined" color="secondary" onClick={() => {
            if (onClose) {
              onClose();
            } else {
              router.push('/persons');
            }
          }} disabled={submitting}>
            Abbrechen
          </Button>
        </Stack>
      </form>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}
