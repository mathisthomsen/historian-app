'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  Skeleton,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Button,
} from '@mui/material';
import {
  LocationOn,
  Event,
  Person,
  TrendingUp,
  Map,
  Visibility,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import SiteHeader from '../components/SiteHeader';
import { api } from '../lib/api';

interface LocationData {
  location: string;
  eventCount: number;
  lifeEventCount: number;
  totalCount: number;
  lastUsed: string | null;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchLocationData();
  }, []);

  const fetchLocationData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching location data...');
      const data = await api.get('/api/locations');
      console.log('Location data received:', data);
      setLocations(data);
    } catch (error) {
      console.error('Error fetching location data:', error);
      setError('Failed to fetch location data');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationClick = (location: string) => {
    router.push(`/locations/${encodeURIComponent(location)}`);
  };

  const totalLocations = locations.length;
  const totalEvents = locations.reduce((sum, loc) => sum + loc.eventCount, 0);
  const totalLifeEvents = locations.reduce((sum, loc) => sum + loc.lifeEventCount, 0);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <SiteHeader title="Orte" showOverline={false} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={120} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={120} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={120} />
          </Grid>
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 6 }}>
      <SiteHeader title="Orte" showOverline={false} />
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Orte
                  </Typography>
                  <Typography variant="h4" component="div">
                    {totalLocations}
                  </Typography>
                </Box>
                <Map sx={{ fontSize: 40, color: 'primary.main' }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Historische Ereignisse
                  </Typography>
                  <Typography variant="h4" component="div">
                    {totalEvents}
                  </Typography>
                </Box>
                <Event sx={{ fontSize: 40, color: 'secondary.main' }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Lebensereignisse
                  </Typography>
                  <Typography variant="h4" component="div">
                    {totalLifeEvents}
                  </Typography>
                </Box>
                <Person sx={{ fontSize: 40, color: 'success.main' }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Gesamt
                  </Typography>
                  <Typography variant="h4" component="div">
                    {totalEvents + totalLifeEvents}
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: 'info.main' }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Locations List */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
          Alle Orte
        </Typography>
        
        {locations.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <LocationOn sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Keine Orte vorhanden
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Orte werden automatisch hinzugefügt, wenn Sie Ereignisse oder Lebensereignisse erstellen.
            </Typography>
          </Box>
        ) : (
          <List>
            {locations.map((location, index) => (
              <Box key={location.location}>
                <ListItem 
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                  onClick={() => handleLocationClick(location.location)}
                >
                  <Box sx={{ flexGrow: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="h6">
                        {location.location}
                      </Typography>
                      <Chip 
                        label={`${location.totalCount} Ereignisse`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Stack>
                    
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Event fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {location.eventCount} historische Ereignisse
                          </Typography>
                        </Stack>
                        
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <Person fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {location.lifeEventCount} Lebensereignisse
                          </Typography>
                        </Stack>
                      </Stack>
                      
                      {location.lastUsed && (
                        <Typography variant="body2" color="text.secondary">
                          Zuletzt verwendet: {new Date(location.lastUsed).toLocaleDateString('de-DE')}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                  
                  <ListItemSecondaryAction>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip 
                        label={location.eventCount}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                      <Chip 
                        label={location.lifeEventCount}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLocationClick(location.location);
                        }}
                      >
                        Details
                      </Button>
                    </Stack>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < locations.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
} 