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
  Pagination,
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
import { ErrorBoundary } from '../components/ErrorBoundary';
import RequireAuth from '../components/RequireAuth';

interface LocationData {
  location: string;
  eventCount: number;
  lifeEventCount: number;
  totalCount: number;
  lastUsed: string | null;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalLifeEvents, setTotalLifeEvents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchLocationData = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/api/locations?page=${page}&limit=20`);
      setLocations(Array.isArray(data.locations) ? data.locations : []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
      setTotalEvents(data.totalEvents || 0);
      setTotalLifeEvents(data.totalLifeEvents || 0);
    } catch (error) {
      setError('Failed to fetch location data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocationData(1);
  }, []);

  const handlePageChange = (_: any, value: number) => {
    fetchLocationData(value);
  };

  const handleLocationClick = (location: string) => {
    router.push(`/locations/${encodeURIComponent(location)}`);
  };

  const totalLocations = pagination.total;

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <SiteHeader title="Orte" showOverline={false} />
        <Grid container spacing={3}>
          {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={120} />
          </Grid>
          {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={120} />
          </Grid>
          {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={120} />
          </Grid>
          {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  return (
    <RequireAuth>
      <ErrorBoundary fallback={
        <Container maxWidth="lg" sx={{ mt: 6 }}>
          <SiteHeader title="Orte" showOverline={false} />
          <Alert severity="error" sx={{ my: 4 }}>
            Fehler beim Laden der Ortsdaten. Bitte versuchen Sie es später erneut.
            <Button color="inherit" size="small" onClick={() => window.location.reload()} sx={{ ml: 2 }}>
              Erneut versuchen
            </Button>
          </Alert>
        </Container>
      }>
        <Container maxWidth="lg" sx={{ mt: 6 }}>
          <SiteHeader title="Orte" showOverline={false} />
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
              <Button color="inherit" size="small" onClick={() => fetchLocationData(1)} sx={{ ml: 2 }}>
                Erneut versuchen
              </Button>
            </Alert>
          )}
          
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
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
            
            {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
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
            
            {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
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
            
            {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
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

          {/* Pagination Controls */}
          <Box display="flex" justifyContent="center" mt={4}>
            <Pagination
              count={pagination.totalPages}
              page={pagination.page}
              onChange={handlePageChange}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
            />
          </Box>
        </Container>
      </ErrorBoundary>
    </RequireAuth>
  );
} 