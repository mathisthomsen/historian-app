'use client';

import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
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
  Drawer,
  Snackbar,
  ToggleButton,
  ToggleButtonGroup,
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
  ChevronLeft,
} from '@mui/icons-material';
import SiteHeader from '../../components/layout/SiteHeader';
import type { GridProps } from '@mui/material/Grid';
import Grid from '@mui/material/Grid';
import EventForm from '../../components/forms/EventForm';
import Link from 'next/link';
import EventIcon from '@mui/icons-material/Event';
import Badge from '@mui/material/Badge';



interface HistoricEvent {
  id: number;
  title: string;
  date?: string;
  end_date?: string;
  location?: string;
  description?: string;
  subEvents?: any[];
  parentId?: number;
}

type Params = Promise<{ id: string }>;

export default function EventDetailPage({ params }: { params: Params }) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const router = useRouter();
  const [event, setEvent] = useState<HistoricEvent | null>(null);
  const [personEventRelations, setPersonEventRelations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [subEventDrawerOpen, setSubEventDrawerOpen] = useState(false);
  const [parentEvent, setParentEvent] = useState<{ id: number; title: string } | null>(null);
  const [eventViewType, setEventViewType] = useState<'life' | 'sub' | 'both'>('both');

  useEffect(() => {
    params.then((p) => setResolvedParams(p));
  }, [params]);

  // Move fetchEventData to top-level scope so it can be called from anywhere
  const fetchEventData = useCallback(async () => {
    setLoading(true);
    try {
      if (!resolvedParams) throw new Error('No resolvedParams');
      const eventId = Number(resolvedParams.id);
      
      // Fetch event data
      const eventRes = await fetch(`/api/events/${eventId}`);
      const eventData = await eventRes.json();
      setEvent(eventData);
      
      // Try to fetch relations, but handle gracefully if API is not available
      try {
        const relationsRes = await fetch(`/api/person-event-relations?eventId=${eventId}`);
        if (relationsRes.ok) {
          const relationsData = await relationsRes.json();
          setPersonEventRelations(relationsData.relations || []);
        } else {
          // If API is not available, set empty array
          setPersonEventRelations([]);
        }
      } catch (relationsError) {
        console.warn('Person-event relations API not available:', relationsError);
        setPersonEventRelations([]);
      }
    } catch (error) {
      console.error('Error fetching event data:', error);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams]);

  useEffect(() => {
    if (!resolvedParams) return;
    fetchEventData();
  }, [resolvedParams, fetchEventData]);

  useEffect(() => {
    if (event && event.parentId) {
      fetch(`/api/events/${event.parentId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.id && data.title) setParentEvent({ id: data.id, title: data.title });
        });
    } else {
      setParentEvent(null);
    }
  }, [event]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  // Helper to merge and sort items for timeline/list
  const getCombinedItems = () => {
    if (!event) return [];
    let items: any[] = [];
    if (eventViewType === 'life' || eventViewType === 'both') {
      items = items.concat(personEventRelations.map(relation => ({
        ...relation,
        _type: 'relation',
        date: relation.event?.date || new Date().toISOString(),
        title: `${relation.person?.first_name} ${relation.person?.last_name} - ${relation.relationship_type}`,
      })));
    }
    if ((eventViewType === 'sub' || eventViewType === 'both') && Array.isArray(event.subEvents)) {
      items = items.concat(event.subEvents.map(subEvent => ({
        ...subEvent,
        _type: 'sub',
        date: subEvent.date,
      })));
    }
    // Sort by date ascending
    return items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  if (!resolvedParams || loading) {
    return (
      <Container sx={{ mt: 6 }}>
        <Skeleton variant="text" width={300} height={48} />
        <Paper sx={{ mt: 4, p: 3 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 4 }}><Skeleton width={80} /></Grid>
            <Grid size={{ xs: 8 }}><Skeleton width={180} /></Grid>
            <Grid size={{ xs: 4 }}><Skeleton width={80} /></Grid>
            <Grid size={{ xs: 8 }}><Skeleton width={180} /></Grid>
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

  const eventId = Number(resolvedParams.id);

  return (
    <Container maxWidth="lg" sx={{ mt: 6 }}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }} sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Back button and parent info */}
      {event.parentId && parentEvent ? (
        <Box>
          <Link href={`/events/${parentEvent?.id ?? ''}`} style={{ textDecoration: 'none' }}>
            <Button size="small" color="primary" variant="text" startIcon={<ChevronLeft />}>
              Zurück zu: {parentEvent?.title ?? ''}
            </Button>
          </Link>
        </Box>
      ) : (
        <Box>
          <Link href="/events" style={{ textDecoration: 'none' }}>
            <Button size="small" color="primary" variant="text" startIcon={<ChevronLeft />}>
              Zurück zur Ereignisübersicht
            </Button>
          </Link>
        </Box>
      )}
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Stack spacing={2} alignItems="flex-end" direction="row">
                <Button
                  variant="text"
                  color="secondary"
                  onClick={() => setSubEventDrawerOpen(true)}
                >
                  Unter-Ereignis hinzufügen
              </Button>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => setDrawerOpen(true)}
              >
                Bearbeiten
              </Button>
              
              <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                sx={{
                  '& .MuiDrawer-paper': {
                    width: '500px',
                    padding: 2,
                  },
                  zIndex: 1299,
                }}
              >
                <EventForm
                  mode="edit"
                  eventId={eventId}
                  onClose={() => setDrawerOpen(false)}
                  onResult={(result) => {
                    setSnackbarMsg(result.message);
                    setSnackbarSeverity(result.success ? 'success' : 'error');
                    setSnackbarOpen(true);
                    setDrawerOpen(false);
                    // Refresh event data
                    if (result.success) {
                      setLoading(true);
                      fetchEventData();
                    }
                  }}
                />
              </Drawer>
              <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <Alert
                  severity={snackbarSeverity}
                  onClose={() => setSnackbarOpen(false)}
                  sx={{ width: '100%' }}
                >
                  {snackbarMsg}
                </Alert>
              </Snackbar>
              
            </Stack>
          </Grid>
        </Grid>
        
      
      {/* Sub-Event Drawer */}
      <Drawer
        anchor="right"
        open={subEventDrawerOpen}
        onClose={() => setSubEventDrawerOpen(false)}
      >
        <Box sx={{ width: 400, p: 2 }}>
          <EventForm
            mode="create"
            parentId={eventId}
            onClose={() => setSubEventDrawerOpen(false)}
            onResult={(result) => {
              if (result.success) {
                setSubEventDrawerOpen(false);
                fetchEventData();
              }
            }}
          />
        </Box>
      </Drawer>
      
      {/* Event Info Card */}
      <Paper sx={{ mt: 4, p: 3, mb: 4 }}>
        <Grid container spacing={3} sx={{ justifyContent: 'space-between' }}>
          <Grid size={{ xs: 12, md: 8 }}>
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
                {parentEvent ? (
                  <Link href={`/events/${parentEvent.id}`} style={{ marginLeft: 8, textDecoration: 'underline' }}>
                    <Chip 
                      label={`Teil von: ${parentEvent.title}`}
                      color="primary"
                      variant="outlined"
                      size="small" />
                  </Link>
                ) : null}
              </Box>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
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
                  <Grid size={{ xs: 12, sm: 6 }}>
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
                  
        </Grid>
      </Paper>

      {/* Related Life Events Section */}
      <Box sx={{ width: '100%', mb: 4 }}>
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h5" gutterBottom>
              Verwandte Ereignisse
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

        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <ToggleButtonGroup
            value={eventViewType}
            exclusive
            onChange={(_, value) => value && setEventViewType(value)}
            size="medium"
            color="primary"
          >
            <ToggleButton value="life" sx={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingInline: 2 }}>
              {personEventRelations.length > 0 ? (
                <Badge badgeContent={personEventRelations.length} color="primary" />
              ) : null}
              Personen-Beziehungen
            </ToggleButton>
            <ToggleButton value="sub" sx={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingInline: 2 }}>
              {Array.isArray(event?.subEvents) && event.subEvents.length > 0 ? (
                <Badge badgeContent={event.subEvents.length} color="primary" />
              ) : null}
              Unter-Ereignisse
            </ToggleButton>
            <ToggleButton value="both" sx={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingInline: 2 }}>
              {personEventRelations.length + (Array.isArray(event?.subEvents) ? event.subEvents.length : 0) > 0 ? (
                <Badge badgeContent={personEventRelations.length + (Array.isArray(event?.subEvents) ? event.subEvents.length : 0)} color="primary" />
              ) : null}
              Beides
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {event && getCombinedItems().length === 0 ? (
          eventViewType === 'life' ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <People sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Keine Personen-Beziehungen
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Noch keine Personen mit diesem historischen Ereignis verknüpft.
              </Typography>
              <Button
                variant="contained"
                onClick={() => router.push('/relationships')}
              >
                Beziehungen verwalten
              </Button>
            </Paper>
          ) : eventViewType === 'sub' ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Keine Unter-Ereignisse
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Noch keine Unter-Ereignisse zu diesem historischen Ereignis hinzugefügt.
              </Typography>
              <Button
                variant="contained"
                onClick={() => setSubEventDrawerOpen(true)}
              >
                Unter-Ereignis hinzufügen
              </Button>
            </Paper>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <People sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Keine verwandten Ereignisse
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Noch keine Personen-Beziehungen oder Unter-Ereignisse mit diesem historischen Ereignis verknüpft.
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  onClick={() => router.push('/relationships')}
                >
                  Beziehungen verwalten
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setSubEventDrawerOpen(true)}
                >
                  Unter-Ereignis hinzufügen
                </Button>
              </Stack>
            </Paper>
          )
        ) : event && viewMode === 'timeline' ? (
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
              
              {getCombinedItems().map((item, index) => (
                <Box key={item.id + item._type} sx={{ position: 'relative', mb: 3 }}>
                  {/* Timeline dot */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 16,
                      top: 8,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      bgcolor: item._type === 'life' ? 'primary.main' : 'secondary.main',
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
                                {item.title}
                              </Typography>
                              {item._type === 'life' ? (
                                <Chip label="Lebensereignis" size="small" color="primary" />
                              ) : (
                                <Chip label="Unter-Ereignis" size="small" color="secondary" icon={<EventIcon />} />
                              )}
                            </Stack>
                            
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <AccessTime fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                  {formatDate(item.date)}
                                  {item.end_date && item.end_date !== item.date && (
                                    ` - ${formatDate(item.end_date)}`
                                  )}
                                </Typography>
                              </Stack>
                              
                              {item.location && (
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <Place fontSize="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    {item.location}
                                  </Typography>
                                </Stack>
                              )}
                            </Stack>
                            
                            {item.description && (
                              <Typography variant="body2" color="text.secondary">
                                {item.description}
                              </Typography>
                            )}
                          </Box>
                          
                          {item._type === 'life' && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => router.push(`/persons/${item.person.id}`)}
                            >
                              Zur Person
                            </Button>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        ) : (
          <List>
            {getCombinedItems().map((item) => (
              <ListItem key={item.id + item._type} divider>
                <ListItemAvatar>
                  <Avatar>
                    {item._type === 'life' ? <Person /> : <EventIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="h6">
                        {item.title}
                      </Typography>
                      {item._type === 'life' ? (
                        <Chip label="Lebensereignis" size="small" color="primary" />
                      ) : (
                        <Chip label="Unter-Ereignis" size="small" color="secondary" icon={<EventIcon />} />
                      )}
                    </Stack>
                  }
                  secondary={
                    <Stack spacing={1} sx={{ mt: 1 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <AccessTime fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(item.date)}
                            {item.end_date && item.end_date !== item.date && (
                              ` - ${formatDate(item.end_date)}`
                            )}
                          </Typography>
                        </Stack>
                        
                        {item.location && (
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Place fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {item.location}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                      
                      {item.description && (
                        <Typography variant="body2" color="text.secondary">
                          {item.description}
                        </Typography>
                      )}
                    </Stack>
                  }
                />
                {item._type === 'life' && (
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      onClick={() => router.push(`/persons/${item.person.id}`)}
                    >
                      Zur Person
                    </Button>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Container>
  );
} 