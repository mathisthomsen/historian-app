'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Stack,
  Skeleton,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useRouter } from 'next/navigation';
import {
  LocationOn,
  Event,
  Person,
  CalendarToday,
  AccessTime,
  Place,
  Timeline as TimelineIcon,
  List as ListIcon,
  ArrowBack,
} from '@mui/icons-material';
import SiteHeader from '../../components/SiteHeader';

interface Event {
  id: number;
  title: string;
  date?: string;
  end_date?: string;
  description?: string;
  type: 'historic';
}

interface LifeEvent {
  id: number;
  title: string;
  start_date: string;
  end_date?: string;
  description?: string;
  person: {
    id: number;
    first_name?: string;
    last_name?: string;
  };
  type: 'life';
}

type Params = Promise<{ location: string }>;

export default function LocationDetailPage({ params }: { params: Params }) {
  const [resolvedParams, setResolvedParams] = useState<{ location: string } | null>(null);
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
  const [error, setError] = useState<string | null>(null);

  // Helper to safely convert BigInt or any value to Number
  const toNum = (v: any) => (typeof v === 'bigint' ? Number(v) : Number(v) || 0);

  useEffect(() => {
    params.then((p) => setResolvedParams(p));
  }, [params]);

  useEffect(() => {
    if (!resolvedParams) return;
    async function fetchLocationData() {
      setError(null);
      setLoading(true);
      try {
        const decodedLocation = decodeURIComponent(resolvedParams.location);
        const [eventsRes, lifeEventsRes] = await Promise.all([
          fetch(`/api/events?location=${encodeURIComponent(decodedLocation)}`),
          fetch(`/api/life-events?location=${encodeURIComponent(decodedLocation)}`)
        ]);
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json();
          const safeEvents = Array.isArray(eventsData) ? eventsData : [];
          setEvents(safeEvents.map((event: any) => ({
            id: toNum(event.id ?? event.ID),
            title: event.title ?? event.TITLE ?? '',
            date: event.date ?? event.DATE ?? '',
            end_date: event.end_date ?? event.END_DATE ?? '',
            description: event.description ?? event.DESCRIPTION ?? '',
            type: 'historic' as const
          })));
        } else {
          throw new Error('Events API error');
        }
        if (lifeEventsRes.ok) {
          const lifeEventsData = await lifeEventsRes.json();
          const safeLifeEvents = Array.isArray(lifeEventsData) ? lifeEventsData : [];
          setLifeEvents(safeLifeEvents.map((event: any) => ({
            id: toNum(event.id ?? event.ID),
            title: event.title ?? event.TITLE ?? '',
            start_date: event.start_date ?? event.START_DATE ?? '',
            end_date: event.end_date ?? event.END_DATE ?? '',
            description: event.description ?? event.DESCRIPTION ?? '',
            person: event.person || { id: 0, first_name: '', last_name: '' },
            type: 'life' as const
          })));
        } else {
          throw new Error('LifeEvents API error');
        }
      } catch (error) {
        setError('Fehler beim Laden der Ortsdaten. Bitte versuchen Sie es später erneut.');
        setEvents([]);
        setLifeEvents([]);
      } finally {
        setLoading(false);
      }
    }
    fetchLocationData();
  }, [resolvedParams]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const allEvents = [...events, ...lifeEvents].sort((a, b) => {
    const dateA = a.type === 'historic' ? (a.date ? new Date(a.date).getTime() : 0) : (a.start_date ? new Date(a.start_date).getTime() : 0);
    const dateB = b.type === 'historic' ? (b.date ? new Date(b.date).getTime() : 0) : (b.start_date ? new Date(b.start_date).getTime() : 0);
    return dateA - dateB;
  });

  if (!resolvedParams || loading) {
    return (
      <Container sx={{ mt: 6 }}>
        <Skeleton variant="text" width={300} height={48} />
        <Paper sx={{ mt: 4, p: 3 }}>
          <Grid container spacing={2}>
            {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
            <Grid item xs={4}><Skeleton width={80} /></Grid>
            {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
            <Grid item xs={8}><Skeleton width={180} /></Grid>
            {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
            <Grid item xs={4}><Skeleton width={80} /></Grid>
            {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
            <Grid item xs={8}><Skeleton width={180} /></Grid>
          </Grid>
        </Paper>
      </Container>
    );
  }

  if (error) {
    let title = 'Ort';
    if (resolvedParams && resolvedParams.location) {
      title = decodeURIComponent(resolvedParams.location);
    }
    return (
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <SiteHeader title={title} showOverline={true} overline="Zurück zur Ortsübersicht" />
        <Alert severity="error" sx={{ my: 4 }}>
          {error}
          <Button color="inherit" size="small" onClick={() => window.location.reload()} sx={{ ml: 2 }}>
            Erneut versuchen
          </Button>
        </Alert>
      </Container>
    );
  }

  if (!resolvedParams) {
    return <div style={{ color: 'red', padding: 24 }}>Fehler: Ungültige Ortsparameter.</div>;
  }

  const decodedLocation = decodeURIComponent(resolvedParams.location);

  return (
    <Container maxWidth="lg" sx={{ mt: 6 }}>
      <SiteHeader
        title={decodedLocation}
        showOverline={true}
        overline="Zurück zur Ortsübersicht"
      />
      
      {/* Location Info Card */}
      <Paper sx={{ mt: 4, p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
          <Grid item xs={12} md={8}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  {decodedLocation}
                </Typography>
                <Chip 
                  label="Ort" 
                  color="primary" 
                  variant="outlined" 
                  size="small"
                  icon={<LocationOn />}
                />
              </Box>
              
              <Grid container spacing={2}>
                {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Event color="action" fontSize="small" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Historische Ereignisse
                      </Typography>
                      <Typography variant="body1">
                        {events.length} Ereignisse
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
                
                {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Person color="action" fontSize="small" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Lebensereignisse
                      </Typography>
                      <Typography variant="body1">
                        {lifeEvents.length} Ereignisse
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </Stack>
          </Grid>
          
          {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
          <Grid item xs={12} md={4}>
            <Stack spacing={2} alignItems="flex-end">
              <Box textAlign="center">
                <Typography variant="h6" color="primary">
                  {allEvents.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gesamt Ereignisse
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Events Section */}
      <Box sx={{ width: '100%', mb: 4 }}>
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h5" gutterBottom>
              Alle Ereignisse in {decodedLocation}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {allEvents.length} Ereignisse dokumentiert
            </Typography>
          </Box>
          
          <Tabs 
            value={viewMode} 
            onChange={(_, newValue) => setViewMode(newValue)}
          >
            <Tab 
              value="timeline" 
              icon={<TimelineIcon />} 
              label="Timeline"
              iconPosition="start"
            />
            <Tab 
              value="list" 
              icon={<ListIcon />} 
              label="Liste"
              iconPosition="start"
            />
          </Tabs>
        </Stack>

        {allEvents.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <LocationOn sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Keine Ereignisse für diesen Ort
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Es wurden noch keine Ereignisse für {decodedLocation} dokumentiert.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Event />}
              onClick={() => router.push('/events/create')}
            >
              Erstes Ereignis hinzufügen
            </Button>
          </Paper>
        ) : viewMode === 'timeline' ? (
          <Box sx={{ position: 'relative' }}>
            {/* Timeline line */}
            <Box
              sx={{
                position: 'absolute',
                left: '50%',
                top: 0,
                bottom: 0,
                width: 2,
                backgroundColor: 'primary.main',
                transform: 'translateX(-50%)',
                zIndex: 0,
              }}
            />
            
            <Stack spacing={4}>
              {allEvents.map((event, index) => (
                <Box
                  key={`${event.type}-${event.id}`}
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: index % 2 === 0 ? 'flex-start' : 'flex-end',
                    alignItems: 'center',
                    minHeight: 120,
                  }}
                >
                  {/* Timeline dot */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: event.type === 'historic' ? 'primary.main' : 'secondary.main',
                      border: 3,
                      borderColor: 'background.paper',
                      zIndex: 2,
                      boxShadow: 2,
                    }}
                  />
                  
                  {/* Content card */}
                  <Card
                    sx={{
                      width: '45%',
                      position: 'relative',
                      zIndex: 1,
                      backgroundColor: 'background.paper',
                      boxShadow: 3,
                      '&:hover': {
                        boxShadow: 6,
                        transform: 'translateY(-2px)',
                        transition: 'all 0.2s ease-in-out',
                      },
                    }}
                  >
                    <CardContent>
                      <Stack spacing={1}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="h6" sx={{ flex: 1 }}>
                            {event.title}
                          </Typography>
                          <Chip 
                            label={event.type === 'historic' ? 'Historisch' : 'Lebensereignis'} 
                            size="small"
                            color={event.type === 'historic' ? 'primary' : 'secondary'}
                            variant="outlined"
                          />
                        </Stack>
                        
                        {event.type === 'life' && (
                          <Chip 
                            label={`${event.person.first_name || ''} ${event.person.last_name || ''}`}
                            size="small"
                            color="info"
                            variant="outlined"
                            onClick={() => router.push(`/persons/${event.person.id}`)}
                            clickable
                            sx={{ alignSelf: 'flex-start' }}
                          />
                        )}
                        
                        <Stack direction="row" spacing={1} alignItems="center">
                          <AccessTime fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {event.type === 'historic' 
                              ? formatDate(event.date || '')
                              : formatDate(event.start_date)
                            }
                            {event.type === 'historic' && event.end_date && event.end_date !== event.date && (
                              ` - ${formatDate(event.end_date)}`
                            )}
                            {event.type === 'life' && event.end_date && event.end_date !== event.start_date && (
                              ` - ${formatDate(event.end_date)}`
                            )}
                          </Typography>
                        </Stack>
                        
                        {event.description && (
                          <Typography variant="body2" color="text.secondary">
                            {event.description}
                          </Typography>
                        )}
                        
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            if (event.type === 'historic') {
                              router.push(`/events/${event.id}`);
                            } else {
                              router.push(`/persons/${event.person.id}`);
                            }
                          }}
                          sx={{ alignSelf: 'flex-start' }}
                        >
                          {event.type === 'historic' ? 'Zum Ereignis' : 'Zur Person'}
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Stack>
          </Box>
        ) : (
          <List>
            {allEvents.map((event) => (
              <ListItem key={`${event.type}-${event.id}`} divider>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="h6">
                        {event.title}
                      </Typography>
                      <Chip 
                        label={event.type === 'historic' ? 'Historisch' : 'Lebensereignis'} 
                        size="small"
                        color={event.type === 'historic' ? 'primary' : 'secondary'}
                        variant="outlined"
                      />
                      {event.type === 'life' && (
                        <Chip 
                          label={`${event.person.first_name || ''} ${event.person.last_name || ''}`}
                          size="small"
                          color="info"
                          variant="outlined"
                          onClick={() => router.push(`/persons/${event.person.id}`)}
                          clickable
                        />
                      )}
                    </Stack>
                  }
                  secondary={
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <AccessTime fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {event.type === 'historic' 
                              ? formatDate(event.date || '')
                              : formatDate(event.start_date)
                            }
                            {event.type === 'historic' && event.end_date && event.end_date !== event.date && (
                              ` - ${formatDate(event.end_date)}`
                            )}
                            {event.type === 'life' && event.end_date && event.end_date !== event.start_date && (
                              ` - ${formatDate(event.end_date)}`
                            )}
                          </Typography>
                        </Stack>
                      </Stack>
                      
                      {event.description && (
                        <Typography variant="body2" color="text.secondary">
                          {event.description}
                        </Typography>
                      )}
                    </Stack>
                  }
                />
                <ListItemSecondaryAction>
                  <Button
                    size="small"
                    onClick={() => {
                      if (event.type === 'historic') {
                        router.push(`/events/${event.id}`);
                      } else {
                        router.push(`/persons/${event.person.id}`);
                      }
                    }}
                  >
                    {event.type === 'historic' ? 'Zum Ereignis' : 'Zur Person'}
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Container>
  );
} 