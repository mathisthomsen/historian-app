'use client';

import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Stack,
  Alert,
} from '@mui/material';
import {
  Book,
  Add,
} from '@mui/icons-material';
import SiteHeader from '../../components/layout/SiteHeader';
import { useRouter } from 'next/navigation';

export default function LiteratureCreatePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    year: '',
    description: '',
    url: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Mock submission - in a real app, you'd submit to an API
    setTimeout(() => {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        router.push('/literature');
      }, 2000);
    }, 1000);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 6 }}>
      <SiteHeader
        title="Literatur hinzufügen"
        showOverline={true}
        overline="Zurück zur Literaturübersicht"
      />
      
      <Paper sx={{ p: 4, mt: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Book sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Neue Literatur hinzufügen
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fügen Sie Literaturquellen hinzu, die mit Ihren historischen Forschungen verknüpft sind.
          </Typography>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Literatur erfolgreich hinzugefügt! Sie werden zur Übersicht weitergeleitet.
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              label="Titel"
              name="title"
              value={formData.title}
              onChange={handleChange}
              fullWidth
              required
            />
            
            <TextField
              label="Autor"
              name="author"
              value={formData.author}
              onChange={handleChange}
              fullWidth
              required
            />
            
            <TextField
              label="Jahr"
              name="year"
              type="number"
              value={formData.year}
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
            
            <TextField
              label="URL (optional)"
              name="url"
              type="url"
              value={formData.url}
              onChange={handleChange}
              fullWidth
            />
            
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => router.push('/literature')}
                disabled={loading}
              >
                Abbrechen
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Add />}
                disabled={loading}
              >
                {loading ? 'Wird hinzugefügt...' : 'Literatur hinzufügen'}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
} 