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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Slider,
  FormHelperText,
  Divider,
  Grid,
} from '@mui/material'
import { useRouter } from 'next/navigation'
import SiteHeader from '../layout/SiteHeader'
import { useProject } from '../../contexts/ProjectContext'
import LocationGeocodingField from './LocationGeocodingField'

type PersonFormProps = {
  initialData?: {
    first_name: string
    last_name: string
    birth_date?: string
    birth_place?: string
    death_date?: string
    death_place?: string
    notes?: string
    // Advanced fields
    birth_date_original?: string
    birth_date_uncertainty?: string
    birth_place_confidence?: number
    birth_place_normalized?: string
    death_date_original?: string
    death_date_uncertainty?: string
    death_place_confidence?: number
    death_place_normalized?: string
    name_confidence?: number
    created_via_import?: boolean
    import_batch_id?: string
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

type Location = {
  id: number;
  name: string;
  normalized?: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
};

const UNCERTAINTY_TYPES = [
  { value: 'EXACT', label: 'Exakt', description: 'Vollständig gesichertes Datum' },
  { value: 'ESTIMATED', label: 'Geschätzt', description: 'Ungefähres Datum' },
  { value: 'APPROXIMATE', label: 'Ungefähr', description: 'Circa-Datum' },
  { value: 'UNKNOWN', label: 'Unbekannt', description: 'Datum unbekannt' },
];

export default function PersonForm({ mode, personId, onClose, onResult }: { mode: 'create' | 'edit'; personId?: number; onClose?: () => void; onResult?: (result: { success: boolean; message: string }) => void }) {
  const router = useRouter();
  const { selectedProject } = useProject();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    birth_date: '',
    birth_place: '',
    death_date: '',
    death_place: '',
    notes: '',
    // Advanced fields
    birth_date_original: '',
    birth_date_uncertainty: 'EXACT',
    birth_place_confidence: 1.0,
    birth_place_normalized: '',
    death_date_original: '',
    death_date_uncertainty: 'EXACT',
    death_place_confidence: 1.0,
    death_place_normalized: '',
    name_confidence: 1.0,
    created_via_import: false,
    import_batch_id: '',
  });
  const [loading, setLoading] = useState(mode === 'edit' && !!personId); // loading only for edit
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  
  // Geocoding data for birth and death places
  const [birthLocationData, setBirthLocationData] = useState<{ 
    latitude?: number; 
    longitude?: number; 
    country?: string; 
    region?: string; 
    city?: string 
  } | null>(null);
  const [deathLocationData, setDeathLocationData] = useState<{ 
    latitude?: number; 
    longitude?: number; 
    country?: string; 
    region?: string; 
    city?: string 
  } | null>(null);

  // Load person data for editing
  useEffect(() => {
    if (mode === 'edit' && personId) {
      const fetchPerson = async () => {
        try {
          const res = await fetch(`/api/persons/${personId}`);
          if (res.ok) {
            const person = await res.json();
            setFormData({
              first_name: person.first_name ?? '',
              last_name: person.last_name ?? '',
              birth_date: person.birth_date ?? '',
              birth_place: person.birth_place ?? '',
              death_date: person.death_date ?? '',
              death_place: person.death_place ?? '',
              notes: person.notes ?? '',
              birth_date_original: person.birth_date_original ?? '',
              birth_date_uncertainty: person.birth_date_uncertainty ?? 'EXACT',
              birth_place_confidence: person.birth_place_confidence ?? 1.0,
              birth_place_normalized: person.birth_place_normalized ?? '',
              death_date_original: person.death_date_original ?? '',
              death_date_uncertainty: person.death_date_uncertainty ?? 'EXACT',
              death_place_confidence: person.death_place_confidence ?? 1.0,
              death_place_normalized: person.death_place_normalized ?? '',
              name_confidence: person.name_confidence ?? 1.0,
              created_via_import: person.created_via_import ?? false,
              import_batch_id: person.import_batch_id ?? '',
            });
            
            // Set geocoding data if available
            if (person.birth_location_ref) {
              setBirthLocationData({
                latitude: person.birth_location_ref.latitude,
                longitude: person.birth_location_ref.longitude,
                country: person.birth_location_ref.country,
                region: person.birth_location_ref.region,
                city: person.birth_location_ref.city,
              });
            }
            
            if (person.death_location_ref) {
              setDeathLocationData({
                latitude: person.death_location_ref.latitude,
                longitude: person.death_location_ref.longitude,
                country: person.death_location_ref.country,
                region: person.death_location_ref.region,
                city: person.death_location_ref.city,
              });
            }
          } else {
            setError('Person nicht gefunden');
          }
        } catch (error) {
          console.error('Error fetching person:', error);
          setError('Fehler beim Laden der Person');
        } finally {
          setLoading(false);
        }
      };
      fetchPerson();
    }
  }, [mode, personId]);

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSliderChange = (field: string) => (event: Event, newValue: number | number[]) => {
    setFormData((prev) => ({ ...prev, [field]: newValue as number }));
  };

  const handleBirthLocationSelect = (location: { 
    name: string; 
    latitude: number; 
    longitude: number; 
    country?: string; 
    region?: string; 
    city?: string 
  }) => {
    setFormData((prev) => ({ 
      ...prev, 
      birth_place: location.name,
      birth_place_normalized: location.name
    }));
    setBirthLocationData({
      latitude: location.latitude,
      longitude: location.longitude,
      country: location.country,
      region: location.region,
      city: location.city,
    });
  };

  const handleDeathLocationSelect = (location: { 
    name: string; 
    latitude: number; 
    longitude: number; 
    country?: string; 
    region?: string; 
    city?: string 
  }) => {
    setFormData((prev) => ({ 
      ...prev, 
      death_place: location.name,
      death_place_normalized: location.name
    }));
    setDeathLocationData({
      latitude: location.latitude,
      longitude: location.longitude,
      country: location.country,
      region: location.region,
      city: location.city,
    });
  };

  // Check for duplicates when form data changes
  useEffect(() => {
    if (mode === 'create' && (formData.first_name.trim() || formData.last_name.trim())) {
      const checkDuplicates = async () => {
        try {
          const res = await fetch('/api/duplicates/detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              first_name: formData.first_name,
              last_name: formData.last_name,
              birth_date: formData.birth_date,
              birth_place: formData.birth_place,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setDuplicates(data.duplicates || []);
            if (data.duplicates && data.duplicates.length > 0) {
              setShowDuplicates(true);
            }
          }
        } catch (error) {
          console.error('Error checking duplicates:', error);
        }
      };
      
      const timeoutId = setTimeout(checkDuplicates, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [formData.first_name, formData.last_name, formData.birth_date, formData.birth_place, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        // Include geocoding data
        birth_location_data: birthLocationData,
        death_location_data: deathLocationData,
      };

      const url = mode === 'create' ? '/api/persons' : `/api/persons/${personId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        const result = await res.json();
        if (onResult) {
          onResult({ success: true, message: mode === 'create' ? 'Person erfolgreich erstellt' : 'Person erfolgreich aktualisiert' });
        } else {
          router.push('/persons');
        }
      } else {
        const errorData = await res.json();
        setError(errorData.error || 'Fehler beim Speichern');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setError('Fehler beim Speichern');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <SiteHeader title="Person wird geladen..." showOverline={false} />
        <Stack spacing={2}>
          <Skeleton variant="rectangular" height={60} />
          <Skeleton variant="rectangular" height={60} />
          <Skeleton variant="rectangular" height={60} />
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <SiteHeader title={mode === 'create' ? 'Neue Person' : 'Person bearbeiten'} showOverline={false} />
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Basic Information */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Grundinformationen
            </Typography>
            <Grid container spacing={2}>
              {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Vorname"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange('first_name')}
                  fullWidth
                  required
                />
              </Grid>
              {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nachname"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange('last_name')}
                  fullWidth
                  required
                />
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* Birth Information */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Geburtsinformationen
            </Typography>
            <Grid container spacing={2}>
              {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Geburtsdatum"
                  name="birth_date"
                  value={formData.birth_date}
                  onChange={handleInputChange('birth_date')}
                  placeholder="YYYY-MM-DD, YYYY, c. YYYY"
                  helperText="Unterstützt: Vollständige Daten, Jahre, circa"
                  fullWidth
                />
              </Grid>
              {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
              <Grid item xs={12} sm={6}>
                <LocationGeocodingField
                  label="Geburtsort"
                  value={formData.birth_place}
                  onChange={(value) => setFormData(prev => ({ ...prev, birth_place: value }))}
                  onLocationSelect={handleBirthLocationSelect}
                  placeholder="Ort eingeben..."
                />
                {birthLocationData && (
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={`📍 ${birthLocationData.city || birthLocationData.region || birthLocationData.country || 'Koordinaten verfügbar'}`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* Death Information */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Sterbeinformationen
            </Typography>
            <Grid container spacing={2}>
              {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Sterbedatum"
                  name="death_date"
                  value={formData.death_date}
                  onChange={handleInputChange('death_date')}
                  placeholder="YYYY-MM-DD, YYYY, c. YYYY"
                  helperText="Unterstützt: Vollständige Daten, Jahre, circa"
                  fullWidth
                />
              </Grid>
              {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
              <Grid item xs={12} sm={6}>
                <LocationGeocodingField
                  label="Sterbeort"
                  value={formData.death_place}
                  onChange={(value) => setFormData(prev => ({ ...prev, death_place: value }))}
                  onLocationSelect={handleDeathLocationSelect}
                  placeholder="Ort eingeben..."
                />
                {deathLocationData && (
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={`📍 ${deathLocationData.city || deathLocationData.region || deathLocationData.country || 'Koordinaten verfügbar'}`}
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* Notes */}
          <Box>
            <TextField
              label="Notizen"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange('notes')}
              multiline
              rows={4}
              fullWidth
            />
          </Box>

          {/* Advanced Fields Toggle */}
          <Box>
            <Button
              variant="outlined"
              onClick={() => setShowAdvancedFields(!showAdvancedFields)}
              sx={{ mb: 2 }}
            >
              {showAdvancedFields ? 'Erweiterte Felder ausblenden' : 'Erweiterte Felder anzeigen'}
            </Button>

            {showAdvancedFields && (
              <Stack spacing={2}>
                {/* Confidence Sliders */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Vertrauenswerte
                  </Typography>
                  <Grid container spacing={2}>
                    {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        Geburtsort-Vertrauen: {Math.round(formData.birth_place_confidence * 100)}%
                      </Typography>
                      <Slider
                        value={formData.birth_place_confidence}
                        onChange={handleSliderChange('birth_place_confidence')}
                        min={0}
                        max={1}
                        step={0.1}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                      />
                    </Grid>
                    {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        Sterbeort-Vertrauen: {Math.round(formData.death_place_confidence * 100)}%
                      </Typography>
                      <Slider
                        value={formData.death_place_confidence}
                        onChange={handleSliderChange('death_place_confidence')}
                        min={0}
                        max={1}
                        step={0.1}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Uncertainty Types */}
                <Grid container spacing={2}>
                  {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Geburtsdatum-Unsicherheit</InputLabel>
                      <Select
                        value={formData.birth_date_uncertainty}
                        onChange={(e) => setFormData(prev => ({ ...prev, birth_date_uncertainty: e.target.value }))}
                        label="Geburtsdatum-Unsicherheit"
                      >
                        {UNCERTAINTY_TYPES.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Sterbedatum-Unsicherheit</InputLabel>
                      <Select
                        value={formData.death_date_uncertainty}
                        onChange={(e) => setFormData(prev => ({ ...prev, death_date_uncertainty: e.target.value }))}
                        label="Sterbedatum-Unsicherheit"
                      >
                        {UNCERTAINTY_TYPES.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Stack>
            )}
          </Box>

          {/* Submit Button */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            {onClose && (
              <Button variant="outlined" onClick={onClose}>
                Abbrechen
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
            >
              {submitting ? 'Speichern...' : (mode === 'create' ? 'Person erstellen' : 'Person aktualisieren')}
            </Button>
          </Box>
        </Stack>
      </form>

      {/* Duplicates Modal */}
      {showDuplicates && (
        <Box sx={{ mt: 3 }}>
          <Alert severity="warning">
            Mögliche Duplikate gefunden! Bitte überprüfen Sie die gefundenen Duplikate bevor Sie fortfahren.
          </Alert>
          <Stack spacing={1} sx={{ mt: 2 }}>
            {duplicates.map((duplicate) => (
              <Box key={duplicate.id} sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="subtitle1">
                  {duplicate.first_name} {duplicate.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ähnlichkeit: {Math.round(duplicate.confidence * 100)}% - {duplicate.reason}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}
    </Container>
  );
}
