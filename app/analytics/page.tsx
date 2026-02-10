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
  Divider,
  Button,
} from '@mui/material';
import {
  People,
  Event,
  Timeline,
  TrendingUp,
  CalendarToday,
  LocationOn,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import SiteHeader from '../components/layout/SiteHeader';
import ChartsEvents from '../components/data/ChartsEvents';
import { api } from '@/app/lib';
import { ErrorBoundary } from '../components/layout/ErrorBoundary';
import RequireAuth from '../components/layout/RequireAuth';

interface AnalyticsData {
  totalPersons: number;
  totalEvents: number;
  totalLifeEvents: number;
  eventsByYear: { year: number; count: number }[];
  eventsByLocation: { location: string; count: number }[];
  events: {
    id: number;
    title: string;
    description: string | null;
    date: string | null;
    end_date: string | null;
    location: string | null;
  }[];
  recentActivity: {
    type: 'person' | 'event' | 'life_event';
    title: string;
    date: string;
  }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setError(null);
      setLoading(true);
      try {
        const data = await api.get('/api/analytics');
        if (!data || typeof data !== 'object' || !Array.isArray(data.events)) {
          throw new Error('Invalid analytics data');
        }
        setData(data);
      } catch (err) {
        setError('Fehler beim Laden der Analytics-Daten. Bitte versuchen Sie es später erneut.');
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 6 }}>
        <SiteHeader title="Analytics" showOverline={false} />
        <Grid container spacing={3}>
          {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
          <Grid item xs={12} md={3}>
            <Skeleton variant="rectangular" height={120} />
          </Grid>
          {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
          <Grid item xs={12} md={3}>
            <Skeleton variant="rectangular" height={120} />
          </Grid>
          {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
          <Grid item xs={12} md={3}>
            <Skeleton variant="rectangular" height={120} />
          </Grid>
          {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
          <Grid item xs={12} md={3}>
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

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 6 }}>
        <SiteHeader title="Analytics" showOverline={false} />
        <Alert severity="error" sx={{ my: 4 }}>
          {error}
          <Button color="inherit" size="small" onClick={() => window.location.reload()} sx={{ ml: 2 }}>
            Erneut versuchen
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <RequireAuth>
      <ErrorBoundary fallback={
        <Container maxWidth="xl" sx={{ mt: 6 }}>
          <SiteHeader title="Analytics" showOverline={false} />
          <Alert severity="error" sx={{ my: 4 }}>
            Fehler beim Laden der Analytics-Daten. Bitte versuchen Sie es später erneut.
            <Button color="inherit" size="small" onClick={() => window.location.reload()} sx={{ ml: 2 }}>
              Erneut versuchen
            </Button>
          </Alert>
        </Container>
      }>
        <Container maxWidth="xl" sx={{ mt: 6 }}>
          <SiteHeader title="Analytics & Insights" showOverline={false} />
          
          {/* Stats Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Personen
                      </Typography>
                      <Typography variant="h4" component="div">
                        {data.totalPersons}
                      </Typography>
                    </Box>
                    <People sx={{ fontSize: 40, color: 'primary.main' }} />
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
                        {data.totalEvents}
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
                        {data.totalLifeEvents}
                      </Typography>
                    </Box>
                    <Timeline sx={{ fontSize: 40, color: 'success.main' }} />
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
                        {data.totalPersons + data.totalEvents + data.totalLifeEvents}
                      </Typography>
                    </Box>
                    <TrendingUp sx={{ fontSize: 40, color: 'info.main' }} />
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts Section */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <CalendarToday sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Ereignisse nach Jahr
                </Typography>
                <ChartsEvents events={data.events || []} />
              </Paper>
            </Grid>
            
            {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Top Orte
                </Typography>
                <Stack spacing={2}>
                  {data.eventsByLocation.map((item, index) => (
                    <Box key={item.location}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">
                          {item.location}
                        </Typography>
                        <Chip 
                          label={item.count} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </Stack>
                      {index < data.eventsByLocation.length - 1 && <Divider sx={{ mt: 1 }} />}
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          {/* Recent Activity */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <AnalyticsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Letzte Aktivitäten
            </Typography>
            <Stack spacing={2}>
              {data.recentActivity.map((activity, index) => (
                <Box key={index}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body1">
                        {activity.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(activity.date).toLocaleDateString('de-DE')}
                      </Typography>
                    </Box>
                    <Chip 
                      label={activity.type === 'person' ? 'Person' : activity.type === 'event' ? 'Ereignis' : 'Lebensereignis'}
                      size="small"
                      color={activity.type === 'person' ? 'primary' : activity.type === 'event' ? 'secondary' : 'success'}
                      variant="outlined"
                    />
                  </Stack>
                  {index < data.recentActivity.length - 1 && <Divider sx={{ mt: 2 }} />}
                </Box>
              ))}
            </Stack>
          </Paper>
        </Container>
      </ErrorBoundary>
    </RequireAuth>
  );
} 