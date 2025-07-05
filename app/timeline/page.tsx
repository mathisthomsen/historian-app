'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Stack,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Slider,
  Grid,
  Divider,
  Skeleton,
  Alert,
  Fab,
  Tooltip,
  Tabs,
  Tab,
  SelectChangeEvent,
} from '@mui/material';
import {
  Search,
  FilterList,
  Timeline as TimelineIcon,
  Event,
  Person,
  LocationOn,
  CalendarToday,
  Add,
  Clear,
  ZoomIn,
  ZoomOut,
} from '@mui/icons-material';
import SiteHeader from '../components/SiteHeader';
import { api } from '../lib/api';
import { ErrorBoundary } from '../components/ErrorBoundary';
import RequireAuth from '../components/RequireAuth';

interface TimelineEvent {
  id: number;
  title: string;
  date: string;
  end_date?: string;
  location?: string;
  description?: string;
  type: 'historic' | 'life';
  person?: {
    id: number;
    first_name?: string;
    last_name?: string;
  };
}

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'historic' | 'life'>('all');
  const [filterYear, setFilterYear] = useState<[number, number]>([1000, 2024]);
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const fetchTimelineData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [eventsRes, lifeEvents] = await Promise.all([
        api.get('/api/events?all=true'),
        api.get('/api/life-events')
      ]);
      const historicEvents = Array.isArray(eventsRes?.events) ? eventsRes.events : [];
      const safeLifeEvents = Array.isArray(lifeEvents) ? lifeEvents : [];
      const timelineEvents: TimelineEvent[] = [
        ...historicEvents
          .filter((event: any) => !!event.date && !isNaN(new Date(event.date).getTime()))
          .map((event: any) => ({
            ...event,
            type: 'historic' as const,
          })),
        ...safeLifeEvents
          .filter((event: any) => !!event.start_date && !isNaN(new Date(event.start_date).getTime()))
          .map((event: any) => ({
            ...event,
            type: 'life' as const,
            date: event.start_date,
          })),
      ];

      setEvents(timelineEvents);
    } catch (error) {
      setError('Fehler beim Laden der Timeline-Daten. Bitte versuchen Sie es später erneut.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimelineData();
  }, [fetchTimelineData]);

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || event.type === filterType;
    
    const eventYear = new Date(event.date).getFullYear();
    const matchesYear = eventYear >= filterYear[0] && eventYear <= filterYear[1];
    
    return matchesSearch && matchesType && matchesYear;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getYearRange = () => {
    if (events.length === 0) return [1000, 2024];
    const years = events.map(event => new Date(event.date).getFullYear());
    return [Math.min(...years), Math.max(...years)];
  };

  const yearRange = getYearRange();

  useEffect(() => {
    // Sync filterYear with yearRange if out of bounds or on initial load
    const minYear = yearRange[0];
    const maxYear = yearRange[1];
    const currentMinYear = filterYear[0];
    const currentMaxYear = filterYear[1];
    
    if (
      currentMinYear < minYear ||
      currentMaxYear > maxYear ||
      (currentMinYear === 1000 && minYear !== 1000) ||
      (currentMaxYear === 2024 && maxYear !== 2024)
    ) {
      setFilterYear([minYear, maxYear]);
    }
  }, [yearRange, filterYear]);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 6 }}>
        <SiteHeader title="Timeline" showOverline={false} />
        <Grid container spacing={3}>
          {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 3 }}>
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="text" width="40%" height={24} sx={{ mt: 2 }} />
              <Skeleton variant="rectangular" height={56} sx={{ mt: 2 }} />
              <Skeleton variant="rectangular" height={56} sx={{ mt: 1 }} />
            </Paper>
          </Grid>
          {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
          <Grid item xs={12} md={9}>
            <Paper sx={{ p: 3, minHeight: 600 }}>
              <Skeleton variant="rectangular" height={400} />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 6 }}>
        <SiteHeader title="Timeline" showOverline={false} />
        <Alert severity="error" sx={{ my: 4 }}>
          Fehler beim Laden der Timeline-Daten. Bitte versuchen Sie es später erneut.
          <Button color="inherit" size="small" onClick={() => window.location.reload()} sx={{ ml: 2 }}>
            Erneut versuchen
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <RequireAuth>
      <ErrorBoundary fallback={
        <Container maxWidth="xl" sx={{ mt: 6 }}>
          <SiteHeader title="Timeline" showOverline={false} />
          <Alert severity="error" sx={{ my: 4 }}>
            Fehler beim Laden der Timeline-Daten. Bitte versuchen Sie es später erneut.
            <Button color="inherit" size="small" onClick={() => window.location.reload()} sx={{ ml: 2 }}>
              Erneut versuchen
            </Button>
          </Alert>
        </Container>
      }>
        <Container maxWidth="xl" sx={{ mt: 6 }}>
          <SiteHeader title="Timeline" showOverline={false} />
          
          <Grid container spacing={3}>
            {/* Filters Sidebar */}
            {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 3, position: 'sticky', top: 24 }}>
                <Typography variant="h6" gutterBottom>
                  <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Filter
                </Typography>
                
                <Stack spacing={3}>
                  {/* Search */}
                  <TextField
                    fullWidth
                    label="Suche"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                      endAdornment: searchTerm && (
                        <IconButton size="small" onClick={() => setSearchTerm('')}>
                          <Clear />
                        </IconButton>
                      ),
                    }}
                  />

                  {/* Event Type Filter */}
                  <FormControl fullWidth>
                    <InputLabel>Ereignistyp</InputLabel>
                    <Select
                      value={filterType}
                      label="Ereignistyp"
                      onChange={(e: SelectChangeEvent) => setFilterType(e.target.value as any)}
                    >
                      <MenuItem value="all">Alle Ereignisse</MenuItem>
                      <MenuItem value="historic">Historische Ereignisse</MenuItem>
                      <MenuItem value="life">Lebensereignisse</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Year Range Filter */}
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Zeitraum: {filterYear[0]} - {filterYear[1]}
                    </Typography>
                    <Slider
                      value={filterYear}
                      onChange={(_, newValue) => setFilterYear(newValue as [number, number])}
                      min={yearRange[0]}
                      max={yearRange[1]}
                      valueLabelDisplay="auto"
                      sx={{ mt: 2 }}
                    />
                  </Box>

                  {/* Results Count */}
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {filteredEvents.length} von {events.length} Ereignissen
                    </Typography>
                  </Box>

                  {/* Zoom Controls */}
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Zoom
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <IconButton 
                        size="small" 
                        onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                      >
                        <ZoomOut />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                      >
                        <ZoomIn />
                      </IconButton>
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            </Grid>

            {/* Timeline Content */}
            {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
            <Grid item xs={12} md={9}>
              <Paper sx={{ p: 3 }}>
                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      Historische Timeline
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {filteredEvents.length} Ereignisse gefunden
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
                      icon={<Event />} 
                      label="Liste"
                      iconPosition="start"
                    />
                  </Tabs>
                </Stack>

                {filteredEvents.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <TimelineIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Keine Ereignisse gefunden
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Versuchen Sie andere Suchkriterien oder Filter.
                    </Typography>
                  </Box>
                ) : viewMode === 'timeline' ? (
                  <Box sx={{ position: 'relative', transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}>
                    {/* Timeline line */}
                    <Box
                      sx={{
                        position: 'absolute',
                        left: '50%',
                        top: 0,
                        bottom: 0,
                        width: 3,
                        bgcolor: 'primary.main',
                        transform: 'translateX(-50%)',
                        zIndex: 1,
                      }}
                    />
                    
                    <Stack spacing={4}>
                      {sortedEvents.map((event, index) => (
                        <Box
                          key={`${event.type}-${event.id}`}
                          sx={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: index % 2 === 0 ? 'flex-start' : 'flex-end',
                            width: '100%',
                          }}
                        >
                          {/* Timeline dot */}
                          <Box
                            sx={{
                              position: 'absolute',
                              left: '50%',
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              bgcolor: event.type === 'historic' ? 'primary.main' : 'secondary.main',
                              border: 3,
                              borderColor: 'background.paper',
                              transform: 'translateX(-50%)',
                              zIndex: 2,
                            }}
                          />
                          
                          {/* Content */}
                          <Card
                            sx={{
                              width: '45%',
                              ml: index % 2 === 0 ? 0 : 'auto',
                              mr: index % 2 === 0 ? 'auto' : 0,
                              position: 'relative',
                            }}
                          >
                            <CardContent>
                              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                <Box sx={{ flex: 1 }}>
                                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                    <Chip 
                                      label={event.type === 'historic' ? 'Historisch' : 'Lebensereignis'}
                                      size="small"
                                      color={event.type === 'historic' ? 'primary' : 'secondary'}
                                      variant="outlined"
                                    />
                                    {event.person && (
                                      <Chip 
                                        label={`${event.person.first_name || ''} ${event.person.last_name || ''}`}
                                        size="small"
                                        icon={<Person />}
                                        variant="outlined"
                                      />
                                    )}
                                  </Stack>
                                  
                                  <Typography variant="h6" gutterBottom>
                                    {event.title}
                                  </Typography>
                                  
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {formatDate(event.date)}
                                    {event.end_date && event.end_date !== event.date && (
                                      ` - ${formatDate(event.end_date)}`
                                    )}
                                  </Typography>
                                  
                                  {event.location && (
                                    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
                                      <LocationOn fontSize="small" color="action" />
                                      <Typography variant="body2" color="text.secondary">
                                        {event.location}
                                      </Typography>
                                    </Stack>
                                  )}
                                  
                                  {event.description && (
                                    <Typography variant="body2">
                                      {event.description}
                                    </Typography>
                                  )}
                                </Box>
                              </Stack>
                            </CardContent>
                          </Card>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {sortedEvents.map((event) => (
                      <Card key={`${event.type}-${event.id}`}>
                        <CardContent>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box sx={{ flex: 1 }}>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                <Chip 
                                  label={event.type === 'historic' ? 'Historisch' : 'Lebensereignis'}
                                  size="small"
                                  color={event.type === 'historic' ? 'primary' : 'secondary'}
                                  variant="outlined"
                                />
                                {event.person && (
                                  <Chip 
                                    label={`${event.person.first_name || ''} ${event.person.last_name || ''}`}
                                    size="small"
                                    icon={<Person />}
                                    variant="outlined"
                                  />
                                )}
                              </Stack>
                              
                              <Typography variant="h6" gutterBottom>
                                {event.title}
                              </Typography>
                              
                              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <CalendarToday fontSize="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    {formatDate(event.date)}
                                    {event.end_date && event.end_date !== event.date && (
                                      ` - ${formatDate(event.end_date)}`
                                    )}
                                  </Typography>
                                </Stack>
                                
                                {event.location && (
                                  <Stack direction="row" spacing={0.5} alignItems="center">
                                    <LocationOn fontSize="small" color="action" />
                                    <Typography variant="body2" color="text.secondary">
                                      {event.location}
                                    </Typography>
                                  </Stack>
                                )}
                              </Stack>
                              
                              {event.description && (
                                <Typography variant="body2" color="text.secondary">
                                  {event.description}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Grid>
          </Grid>

        </Container>
      </ErrorBoundary>
    </RequireAuth>
  );
} 