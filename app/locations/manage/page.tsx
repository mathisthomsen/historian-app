'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { Map, LocationOn, Add } from '@mui/icons-material';
import SiteHeader from '../../components/layout/SiteHeader';
import LocationMap from '../../components/maps/LocationMap';
import { useProject } from '../../contexts/ProjectContext';
import { api } from '../../lib';

interface Location {
  id: number;
  name: string;
  normalized: string;
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  geocoded_at: string | null;
  usage: {
    events: number;
    lifeEvents: number;
    birthPersons: number;
    deathPersons: number;
    total: number;
  };
}

export default function LocationManagePage() {
  const { selectedProject } = useProject();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newLocationName, setNewLocationName] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchLocations = async () => {
    if (!selectedProject) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/locations/manage?projectId=${selectedProject.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setLocations(data.locations || []);
      } else {
        setError(data.error || 'Failed to fetch locations');
      }
    } catch (error) {
      setError('Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  };

  const createLocation = async () => {
    if (!selectedProject || !newLocationName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/locations/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationName: newLocationName.trim(),
          projectId: selectedProject.id
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setNewLocationName('');
        fetchLocations(); // Refresh the list
      } else {
        setError(data.error || 'Failed to create location');
      }
    } catch (error) {
      setError('Failed to create location');
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [selectedProject]);

  if (!selectedProject) {
    return (
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <SiteHeader title="Orte verwalten" showOverline={false} />
        <Alert severity="info">
          Bitte wählen Sie ein Projekt aus, um Orte zu verwalten.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 6 }}>
      <SiteHeader title="Orte verwalten" showOverline={false} />
      
      {/* Project Context */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Projekt:</strong> {selectedProject.name}
          {selectedProject.description && ` - ${selectedProject.description}`}
        </Typography>
      </Alert>

      {/* Create New Location */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <Add sx={{ mr: 1, verticalAlign: 'middle' }} />
          Neuen Ort hinzufügen
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
          <TextField
            label="Ortsname"
            value={newLocationName}
            onChange={(e) => setNewLocationName(e.target.value)}
            placeholder="z.B. Berlin, Deutschland"
            fullWidth
            disabled={creating}
          />
          <Button
            variant="contained"
            onClick={createLocation}
            disabled={!newLocationName.trim() || creating}
            startIcon={creating ? <CircularProgress size={20} /> : <Add />}
          >
            {creating ? 'Erstelle...' : 'Hinzufügen'}
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Interactive Map */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          <Map sx={{ mr: 1, verticalAlign: 'middle' }} />
          Karte der Orte
        </Typography>
        <LocationMap 
          locations={locations.map(loc => ({
            location: loc.name,
            eventCount: loc.usage.events,
            lifeEventCount: loc.usage.lifeEvents,
            totalCount: loc.usage.total,
            lastUsed: null,
            latitude: loc.latitude,
            longitude: loc.longitude,
            country: loc.country,
            region: loc.region,
            city: loc.city
          }))}
          height={400}
        />
      </Paper>

      {/* Locations List */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
          Alle Orte ({locations.length})
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : locations.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <LocationOn sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Keine Orte vorhanden
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Fügen Sie Orte hinzu, um sie auf der Karte zu sehen.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {locations.map((location) => (
              <Grid item xs={12} sm={6} md={4} key={location.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {location.name}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Chip 
                        label={`${location.usage.total} Verwendungen`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {location.city && `${location.city}, `}
                      {location.region && `${location.region}, `}
                      {location.country}
                    </Typography>

                    {location.latitude && location.longitude ? (
                      <Typography variant="body2" color="success.main">
                        ✅ Geocodiert
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="warning.main">
                        ⚠️ Keine Koordinaten
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Container>
  );
} 