'use client';

import * as React from 'react';
import { use } from 'react';
import { useEffect, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Skeleton,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Tabs,
  Tab,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import {
  Edit,
  Person,
  LocationOn,
  CalendarToday,
  Timeline as TimelineIcon,
  List as ListIcon,
  AccessTime,
  Place,
  People,
} from '@mui/icons-material';
import SiteHeader from '../../components/SiteHeader';

interface LifeEvent {
  id: number;
  title: string;
  start_date: string;
  end_date?: string;
  location?: string;
  description?: string;
  person: {
    id: number;
    first_name?: string;
    last_name?: string;
  };
}

interface HistoricEvent {
  id: number;
  title: string;
  date?: string;
  end_date?: string;
  location?: string;
  description?: string;
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const eventId = Number(id);
  const router = useRouter();
  const [event, setEvent] = useState<HistoricEvent | null>(null);
  const [relatedLifeEvents, setRelatedLifeEvents] = useState<LifeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');

  useEffect(() => {
    async function fetchEventData() {
      setLoading(true);
      try {
        const [eventRes, lifeEventsRes] = await Promise.all([
          fetch(`/api/events/${eventId}`),
          fetch(`/api/life-events?eventId=${eventId}`)
        ]);

        const eventData = await eventRes.json();
        const lifeEventsData = await lifeEventsRes.json();

        setEvent(eventData);
        setRelatedLifeEvents(lifeEventsData);
      } catch (error) {
        console.error('Error fetching event data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchEventData();
  }, [eventId]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  if (loading) {
    return (
      <Container sx={{ mt: 6 }}>
        <Skeleton variant="text" width={300} height={48} />
        <Paper sx={{ mt: 4, p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={4}><Skeleton width={80} /></Grid>
            <Grid item xs={8}><Skeleton width={180} /></Grid>
            <Grid item xs={4}><Skeleton width={80} /></Grid>
            <Grid item xs={8}><Skeleton width={180} /></Grid>
          </Grid>
        </Paper>
      </Container>
    );
  }

  if (!event) {
    return (
      <Container sx={{ mt: 6 }}>
        <Alert severity="error">
          Ereignis nicht gefunden
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 6 }}>
      <SiteHeader
        title={event.title}
        showOverline={true}
        overline="Zurück zur Ereignisübersicht"
      />
      
      {/* Event Info Card */}
      <Paper sx={{ mt: 4, p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  {event.title}
                </Typography>
                <Chip 
                  label="Historisches Ereignis" 
                  color="primary" 
                  variant="outlined" 
                  size="small"
                />
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarToday color="action" fontSize="small" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Datum
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(event.date || '')}
                        {event.end_date && event.end_date !== event.date && (
                          ` - ${formatDate(event.end_date)}`
                        )}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
                
                {event.location && (
                  <Grid item xs={12} sm={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <LocationOn color="action" fontSize="small" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Ort
                        </Typography>
                        <Typography variant="body1">
                          {event.location}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                )}
              </Grid>
              
              {event.description && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Beschreibung
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                    {event.description}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Stack spacing={2} alignItems="flex-end">
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => router.push(`/events/${eventId}/edit`)}
              >
                Bearbeiten
              </Button>
              
              <Box textAlign="center">
                <Typography variant="h6" color="primary">
                  {relatedLifeEvents.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Verwandte Lebensereignisse
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Related Life Events Section */}
      <Box sx={{ width: '100%', mb: 4 }}>
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h5" gutterBottom>
              Verwandte Lebensereignisse
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {relatedLifeEvents.length} Lebensereignisse sind mit diesem historischen Ereignis verbunden
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

        {relatedLifeEvents.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <People sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Keine verwandten Lebensereignisse
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Noch keine Lebensereignisse mit diesem historischen Ereignis verknüpft.
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push('/persons')}
            >
              Personen verwalten
            </Button>
          </Paper>
        ) : viewMode === 'timeline' ? (
          // Timeline View
          <Paper sx={{ p: 3 }}>
            <Box sx={{ position: 'relative' }}>
              {/* Timeline line */}
              <Box
                sx={{
                  position: 'absolute',
                  left: 24,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  bgcolor: 'primary.main',
                  borderRadius: 1,
                }}
              />
              
              {relatedLifeEvents
                .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                .map((lifeEvent, index) => (
                  <Box key={lifeEvent.id} sx={{ position: 'relative', mb: 3 }}>
                    {/* Timeline dot */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 16,
                        top: 8,
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        border: 2,
                        borderColor: 'background.paper',
                        zIndex: 1,
                      }}
                    />
                    
                    {/* Content */}
                    <Box sx={{ ml: 6 }}>
                      <Card variant="outlined">
                        <CardContent>
                          <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent="space-between">
                            <Box sx={{ flex: 1 }}>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                <Typography variant="h6">
                                  {lifeEvent.title}
                                </Typography>
                                <Chip 
                                  label={`${lifeEvent.person.first_name || ''} ${lifeEvent.person.last_name || ''}`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                  onClick={() => router.push(`/persons/${lifeEvent.person.id}`)}
                                  clickable
                                />
                              </Stack>
                              
                              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <AccessTime fontSize="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    {formatDate(lifeEvent.start_date)}
                                    {lifeEvent.end_date && lifeEvent.end_date !== lifeEvent.start_date && (
                                      ` - ${formatDate(lifeEvent.end_date)}`
                                    )}
                                  </Typography>
                                </Stack>
                                
                                {lifeEvent.location && (
                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    <Place fontSize="small" color="action" />
                                    <Typography variant="body2" color="text.secondary">
                                      {lifeEvent.location}
                                    </Typography>
                                  </Stack>
                                )}
                              </Stack>
                              
                              {lifeEvent.description && (
                                <Typography variant="body2" color="text.secondary">
                                  {lifeEvent.description}
                                </Typography>
                              )}
                            </Box>
                            
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => router.push(`/persons/${lifeEvent.person.id}`)}
                            >
                              Zur Person
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Box>
                  </Box>
                ))}
            </Box>
          </Paper>
        ) : (
          // List View
          <List>
            {relatedLifeEvents.map((lifeEvent) => (
              <ListItem key={lifeEvent.id} divider>
                <ListItemAvatar>
                  <Avatar>
                    <Person />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="h6">
                        {lifeEvent.title}
                      </Typography>
                      <Chip 
                        label={`${lifeEvent.person.first_name || ''} ${lifeEvent.person.last_name || ''}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        onClick={() => router.push(`/persons/${lifeEvent.person.id}`)}
                        clickable
                      />
                    </Stack>
                  }
                  secondary={
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <AccessTime fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(lifeEvent.start_date)}
                            {lifeEvent.end_date && lifeEvent.end_date !== lifeEvent.start_date && (
                              ` - ${formatDate(lifeEvent.end_date)}`
                            )}
                          </Typography>
                        </Stack>
                        
                        {lifeEvent.location && (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Place fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {lifeEvent.location}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                      
                      {lifeEvent.description && (
                        <Typography variant="body2" color="text.secondary">
                          {lifeEvent.description}
                        </Typography>
                      )}
                    </Stack>
                  }
                />
                <ListItemSecondaryAction>
                  <Button
                    size="small"
                    onClick={() => router.push(`/persons/${lifeEvent.person.id}`)}
                  >
                    Zur Person
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