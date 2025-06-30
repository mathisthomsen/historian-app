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
import SiteHeader from '../components/SiteHeader';
import ChartsEvents from '../components/ChartsEvents';

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

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Fetch dashboard stats
      const statsRes = await fetch('/api/dashboard/stats');
      const stats = await statsRes.json();

      // Fetch real analytics data
      const analyticsRes = await fetch('/api/analytics');
      const analytics = await analyticsRes.json();

      const realData: AnalyticsData = {
        totalPersons: stats.totalPersons || 0,
        totalEvents: stats.totalEvents || 0,
        totalLifeEvents: stats.totalLifeEvents || 0,
        eventsByYear: analytics.eventsByYear || [],
        eventsByLocation: analytics.eventsByLocation || [],
        events: analytics.events || [],
        recentActivity: analytics.recentActivity || [],
      };

      setData(realData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 6 }}>
        <SiteHeader title="Analytics" showOverline={false} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Skeleton variant="rectangular" height={120} />
          </Grid>
          <Grid item xs={12} md={3}>
            <Skeleton variant="rectangular" height={120} />
          </Grid>
          <Grid item xs={12} md={3}>
            <Skeleton variant="rectangular" height={120} />
          </Grid>
          <Grid item xs={12} md={3}>
            <Skeleton variant="rectangular" height={120} />
          </Grid>
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container sx={{ mt: 6 }}>
        <Alert severity="error">
          Fehler beim Laden der Analytics-Daten
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 6 }}>
      <SiteHeader title="Analytics & Insights" showOverline={false} />
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
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
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <CalendarToday sx={{ mr: 1, verticalAlign: 'middle' }} />
              Ereignisse nach Jahr
            </Typography>
            <ChartsEvents events={data.events || []} />
          </Paper>
        </Grid>
        
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
  );
} 