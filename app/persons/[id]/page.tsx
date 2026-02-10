'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  ToggleButton,
  ToggleButtonGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  LinearProgress,
} from '@mui/material';
import {
  Edit,
  Add,
  Person,
  Event,
  People,
  Source,
  Place,
  CalendarToday,
  TrendingUp,
  LocationOn,
  Map,
  Timeline as TimelineIcon,
  AccountTree,
  ExpandMore,
  Visibility,
  Delete,
  Star,
  StarBorder,
  Warning,
  CheckCircle,
  Help,
  Info,
} from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import SiteHeader from '../../components/layout/SiteHeader';
import { ErrorBoundary } from '../../components/layout/ErrorBoundary';
import RequireAuth from '../../components/layout/RequireAuth';
import { useProject } from '../../contexts/ProjectContext';
import PersonEventForm from '../../components/forms/PersonEventForm';
import RelationshipForm from '../../components/forms/RelationshipForm';
import PersonForm from '../../components/forms/PersonForm';
import PersonLocationMap from '../../components/maps/PersonLocationMap';

interface Person {
  id: number;
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  birth_place?: string;
  birth_location_id?: number;
  death_date?: string;
  death_place?: string;
  death_location_id?: number;
  notes?: string;
  birth_date_original?: string;
  birth_date_uncertainty?: string;
  birth_place_confidence?: number;
  birth_place_normalized?: string;
  death_date_original?: string;
  death_date_uncertainty?: string;
  death_place_confidence?: number;
  death_place_normalized?: string;
  name_confidence?: number;
  created_via_import?: boolean;
  import_batch_id?: string;
  birth_location_ref?: {
    id: number;
    name: string;
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
  death_location_ref?: {
    id: number;
    name: string;
    country?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
  };
}

interface PersonEventRelation {
  id: number;
  person_id: number;
  event_id: number;
  relationship_type: string;
  statement_id?: number;
  person: {
    id: number;
    first_name?: string;
    last_name?: string;
  };
  event: {
    id: number;
    title: string;
    date?: string;
    end_date?: string;
    location?: string;
    location_id?: number;
    latitude?: number;
    longitude?: number;
    country?: string;
    region?: string;
    city?: string;
    description?: string;
  };
  statement?: {
    id: number;
    content: string;
    confidence?: number;
    source?: {
      id: number;
      title: string;
      author?: string;
      year?: number;
    };
  };
  sourceOnRelations: Array<{
    id: number;
    source: {
      id: number;
      title: string;
      author?: string;
      year?: number;
    };
  }>;
}

interface PersonRelation {
  id: number;
  from_person_id: number;
  to_person_id: number;
  relation_type: string;
  notes?: string;
  from_person: {
    id: number;
    first_name?: string;
    last_name?: string;
    birth_date?: string;
    death_date?: string;
  };
  to_person: {
    id: number;
    first_name?: string;
    last_name?: string;
    birth_date?: string;
    death_date?: string;
  };
}

interface Source {
  id: number;
  title: string;
  author?: string;
  year?: number;
  url?: string;
  reliability?: number;
  usageCount?: number;
}

const UNCERTAINTY_TYPES = {
  EXACT: { label: 'Exakt', color: 'success', icon: <CheckCircle /> },
  ESTIMATED: { label: 'Geschätzt', color: 'warning', icon: <Warning /> },
  APPROXIMATE: { label: 'Ungefähr', color: 'info', icon: <Help /> },
  UNKNOWN: { label: 'Unbekannt', color: 'default', icon: <Info /> },
};

const RELATIONSHIP_TYPES = [
  { value: 'participant', label: 'Teilnehmer', color: 'primary' },
  { value: 'witness', label: 'Zeuge', color: 'info' },
  { value: 'affected', label: 'Betroffener', color: 'error' },
  { value: 'organizer', label: 'Organisator', color: 'secondary' },
  { value: 'leader', label: 'Führer', color: 'warning' },
  { value: 'member', label: 'Mitglied', color: 'primary' },
  { value: 'supporter', label: 'Unterstützer', color: 'success' },
  { value: 'opponent', label: 'Gegner', color: 'error' },
  { value: 'victim', label: 'Opfer', color: 'error' },
  { value: 'perpetrator', label: 'Täter', color: 'error' },
];

export default function PersonDetailPage() {
  const params = useParams();
  const personId = Number(params.id);
  const router = useRouter();
  const { selectedProject } = useProject();
  
  const [person, setPerson] = useState<Person | null>(null);
  const [personEvents, setPersonEvents] = useState<PersonEventRelation[]>([]);
  const [personRelations, setPersonRelations] = useState<PersonRelation[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [visualizationMode, setVisualizationMode] = useState<'timeline' | 'map' | 'relations'>('timeline');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [showAddRelationDialog, setShowAddRelationDialog] = useState(false);

  // Fetch person data
  const fetchPersonData = useCallback(async () => {
    try {
      const res = await fetch(`/api/persons/${personId}`);
      if (res.ok) {
        const personData = await res.json();
        setPerson(personData);
      } else {
        setError('Failed to fetch person data');
      }
    } catch (error) {
      console.error('Error fetching person data:', error);
      setError('Error fetching person data');
    }
  }, [personId]);

  // Fetch person events
  const fetchPersonEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/person-event-relations?personId=${personId}`);
      if (res.ok) {
        const data = await res.json();
        setPersonEvents(Array.isArray(data.relations) ? data.relations : []);
      }
    } catch (error) {
      console.error('Error fetching person events:', error);
    }
  }, [personId]);

  // Fetch person relations
  const fetchPersonRelations = useCallback(async () => {
    try {
      const res = await fetch(`/api/person-relations?personId=${personId}`);
      if (res.ok) {
        const data = await res.json();
        setPersonRelations(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching person relations:', error);
    }
  }, [personId]);

  // Fetch sources related to this person
  const fetchSources = useCallback(async () => {
    try {
      const res = await fetch(`/api/sources?personId=${personId}`);
      if (res.ok) {
        const data = await res.json();
        setSources(Array.isArray(data.sources) ? data.sources : []);
      }
    } catch (error) {
      console.error('Error fetching sources:', error);
    }
  }, [personId]);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPersonData(),
        fetchPersonEvents(),
        fetchPersonRelations(),
        fetchSources(),
      ]);
      setLoading(false);
    };
    
    fetchAllData();
  }, [fetchPersonData, fetchPersonEvents, fetchPersonRelations, fetchSources]);

  const getPersonDisplayName = (person: Person) => {
    const name = `${person.first_name || ''} ${person.last_name || ''}`.trim();
    return name || 'Unbekannt';
  };

  const getPersonAge = (person: Person) => {
    if (!person.birth_date) return null;
    
    const birthDate = new Date(person.birth_date);
    const endDate = person.death_date ? new Date(person.death_date) : new Date();
    const age = endDate.getFullYear() - birthDate.getFullYear();
    
    if (person.death_date) {
      return `${age} Jahre (verstorben)`;
    }
    return `${age} Jahre`;
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'default';
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const getConfidenceLabel = (confidence?: number) => {
    if (!confidence) return 'Unbekannt';
    if (confidence >= 0.8) return 'Hoch';
    if (confidence >= 0.6) return 'Mittel';
    return 'Niedrig';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unbekannt';
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatYear = (dateString?: string) => {
    if (!dateString) return 'Unbekannt';
    return new Date(dateString).getFullYear().toString();
  };

  const getUncertaintyInfo = (uncertainty?: string) => {
    if (!uncertainty) return UNCERTAINTY_TYPES.UNKNOWN;
    return UNCERTAINTY_TYPES[uncertainty as keyof typeof UNCERTAINTY_TYPES] || UNCERTAINTY_TYPES.UNKNOWN;
  };

  const getRelationshipLabel = (relationType: string) => {
    const relation = RELATIONSHIP_TYPES.find(r => r.value === relationType);
    return relation ? relation.label : relationType;
  };

  const getRelationshipColor = (relationType: string) => {
    const relation = RELATIONSHIP_TYPES.find(r => r.value === relationType);
    return relation ? relation.color : 'default';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <SiteHeader title="Person" showOverline={false} />
        <Grid container spacing={3}>
          {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
          <Grid item xs={12}>
            <Skeleton variant="rectangular" height={300} />
          </Grid>
          {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={200} />
          </Grid>
          {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={200} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error || !person) {
    return (
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <SiteHeader title="Person" showOverline={false} />
        <Alert severity="error" sx={{ my: 4 }}>
          {error || 'Person nicht gefunden'}
          <Button color="inherit" size="small" onClick={() => router.push('/persons')} sx={{ ml: 2 }}>
            Zurück zur Übersicht
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <RequireAuth>
      <ErrorBoundary fallback={
        <Container maxWidth="lg" sx={{ mt: 6 }}>
          <SiteHeader title="Person" showOverline={false} />
          <Alert severity="error" sx={{ my: 4 }}>
            Fehler beim Laden der Person. Bitte versuchen Sie es später erneut.
          </Alert>
        </Container>
      }>
        <Container maxWidth="lg" sx={{ mt: 6 }}>
          <SiteHeader title={getPersonDisplayName(person)} showOverline={false} />
          
          {/* Core Data Section */}
          <Paper sx={{ p: 4, mb: 3 }}>
            <Grid container spacing={3} alignItems="center">
              {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
              <Grid item xs={12} md={8}>
                <Stack spacing={2}>
                  {/* Name and Age */}
                  <Box>
                    <Typography variant="h4" component="h1" gutterBottom>
                      {getPersonDisplayName(person)}
                    </Typography>
                    {getPersonAge(person) && (
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        {getPersonAge(person)}
                      </Typography>
                    )}
                  </Box>

                  {/* Birth Information */}
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      <CalendarToday sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Geburt
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="body1">
                        {formatDate(person.birth_date)}
                      </Typography>
                      {person.birth_date_uncertainty && (
                        <Chip
                          icon={getUncertaintyInfo(person.birth_date_uncertainty).icon}
                          label={getUncertaintyInfo(person.birth_date_uncertainty).label}
                          color={getUncertaintyInfo(person.birth_date_uncertainty).color as any}
                          size="small"
                        />
                      )}
                    </Stack>
                    {person.birth_place && (
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                        <Place fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {person.birth_place}
                          {person.birth_location_ref && (
                            <span> ({person.birth_location_ref.country})</span>
                          )}
                        </Typography>
                        {person.birth_place_confidence && (
                          <Chip
                            label={`${getConfidenceLabel(person.birth_place_confidence)} (${Math.round(person.birth_place_confidence * 100)}%)`}
                            color={getConfidenceColor(person.birth_place_confidence) as any}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    )}
                  </Box>

                  {/* Death Information */}
                  {person.death_date && (
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        <CalendarToday sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Tod
                      </Typography>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Typography variant="body1">
                          {formatDate(person.death_date)}
                        </Typography>
                        {person.death_date_uncertainty && (
                          <Chip
                            icon={getUncertaintyInfo(person.death_date_uncertainty).icon}
                            label={getUncertaintyInfo(person.death_date_uncertainty).label}
                            color={getUncertaintyInfo(person.death_date_uncertainty).color as any}
                            size="small"
                          />
                        )}
                      </Stack>
                      {person.death_place && (
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
                          <Place fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {person.death_place}
                            {person.death_location_ref && (
                              <span> ({person.death_location_ref.country})</span>
                            )}
                          </Typography>
                          {person.death_place_confidence && (
                            <Chip
                              label={`${getConfidenceLabel(person.death_place_confidence)} (${Math.round(person.death_place_confidence * 100)}%)`}
                              color={getConfidenceColor(person.death_place_confidence) as any}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      )}
                    </Box>
                  )}

                  {/* Notes */}
                  {person.notes && (
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        Notizen
                      </Typography>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                        {person.notes}
                      </Typography>
                    </Box>
                  )}

                  {/* Import Metadata */}
                  {person.created_via_import && (
                    <Box>
                      <Chip
                        label={`Import: ${person.import_batch_id || 'Unbekannt'}`}
                        color="info"
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  )}
                </Stack>
              </Grid>

              {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
              <Grid item xs={12} md={4}>
                <Stack spacing={2}>
                  {/* Actions */}
                  <Button
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={() => setShowEditDialog(true)}
                    fullWidth
                  >
                    Person bearbeiten
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => setShowAddEventDialog(true)}
                    fullWidth
                  >
                    Ereignis hinzufügen
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<People />}
                    onClick={() => setShowAddRelationDialog(true)}
                    fullWidth
                  >
                    Beziehung hinzufügen
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {/* Visualization Section */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography variant="h6">
                Visualisierung
              </Typography>
              <ToggleButtonGroup
                value={visualizationMode}
                exclusive
                onChange={(_, newMode) => newMode && setVisualizationMode(newMode)}
                size="small"
              >
                <ToggleButton value="timeline">
                  <TimelineIcon />
                  Timeline
                </ToggleButton>
                <ToggleButton value="map">
                  <Map />
                  Karte
                </ToggleButton>
                <ToggleButton value="relations">
                  <AccountTree />
                  Beziehungen
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Timeline Visualization */}
            {visualizationMode === 'timeline' && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Lebensereignisse Timeline
                </Typography>
                {personEvents.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    Keine Ereignisse verfügbar
                  </Typography>
                ) : (
                  <Stack spacing={2}>
                    {personEvents
                      .sort((a, b) => new Date(a.event.date || 0).getTime() - new Date(b.event.date || 0).getTime())
                      .map((relation, index) => (
                        <Card key={relation.id} sx={{ p: 2 }}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ minWidth: 80 }}>
                              <Typography variant="h6" color="primary">
                                {formatYear(relation.event.date)}
                              </Typography>
                            </Box>
                            <Divider orientation="vertical" flexItem />
                            <Box sx={{ flex: 1 }}>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                                <Typography variant="subtitle1">
                                  {relation.event.title}
                                </Typography>
                                <Chip
                                  label={getRelationshipLabel(relation.relationship_type)}
                                  color={getRelationshipColor(relation.relationship_type) as any}
                                  size="small"
                                />
                              </Stack>
                              {relation.event.location && (
                                <Typography variant="body2" color="text.secondary">
                                  <Place fontSize="small" sx={{ mr: 0.5 }} />
                                  {relation.event.location}
                                </Typography>
                              )}
                              {relation.statement && (
                                <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
                                  "{relation.statement.content.length > 100 
                                    ? `${relation.statement.content.substring(0, 100)}...`
                                    : relation.statement.content
                                  }"
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </Card>
                      ))}
                  </Stack>
                )}
              </Box>
            )}

            {/* Map Visualization */}
            {visualizationMode === 'map' && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Orte der Lebensereignisse
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  <PersonLocationMap personEvents={personEvents} person={person} />
                </Typography>
              </Box>
            )}

            {/* Relations Visualization */}
            {visualizationMode === 'relations' && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Beziehungsnetzwerk
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Beziehungsvisualisierung wird implementiert...
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Accordion Sections */}
          <Stack spacing={2}>
            {/* Events Accordion */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Event />
                  <Typography variant="h6">
                    Ereignisse ({personEvents.length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {personEvents.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    Keine Ereignisse verfügbar
                  </Typography>
                ) : (
                  <List>
                    {personEvents.map((relation) => (
                      <ListItem key={relation.id} divider>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="subtitle1">
                                {relation.event.title}
                              </Typography>
                              <Chip
                                label={getRelationshipLabel(relation.relationship_type)}
                                color={getRelationshipColor(relation.relationship_type) as any}
                                size="small"
                              />
                            </Stack>
                          }
                          secondary={
                            <Stack spacing={1}>
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(relation.event.date)}
                                {relation.event.location && ` • ${relation.event.location}`}
                              </Typography>
                              {relation.statement && (
                                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                  "{relation.statement.content.length > 100 
                                    ? `${relation.statement.content.substring(0, 100)}...`
                                    : relation.statement.content
                                  }"
                                </Typography>
                              )}
                              {relation.sourceOnRelations.length > 0 && (
                                <Stack direction="row" spacing={1}>
                                  {relation.sourceOnRelations.slice(0, 3).map((sourceRel) => (
                                    <Chip
                                      key={sourceRel.id}
                                      label={sourceRel.source.title}
                                      size="small"
                                      variant="outlined"
                                    />
                                  ))}
                                  {relation.sourceOnRelations.length > 3 && (
                                    <Chip
                                      label={`+${relation.sourceOnRelations.length - 3} weitere`}
                                      size="small"
                                      variant="outlined"
                                    />
                                  )}
                                </Stack>
                              )}
                            </Stack>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            size="small"
                            onClick={() => router.push(`/events/${relation.event.id}`)}
                          >
                            <Visibility />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Person Relations Accordion */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={2}>
                  <People />
                  <Typography variant="h6">
                    Personen-Beziehungen ({personRelations.length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {personRelations.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    Keine Personen-Beziehungen verfügbar
                  </Typography>
                ) : (
                  <List>
                    {personRelations.map((relation) => (
                      <ListItem key={relation.id} divider>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="subtitle1">
                                {getPersonDisplayName(relation.from_person.id === personId ? relation.to_person : relation.from_person)}
                              </Typography>
                              <Chip
                                label={relation.relation_type}
                                color="primary"
                                size="small"
                              />
                            </Stack>
                          }
                          secondary={
                            <Stack spacing={1}>
                              <Typography variant="body2" color="text.secondary">
                                {relation.from_person.id === personId ? 'Beziehung zu' : 'Beziehung von'} {getPersonDisplayName(relation.from_person.id === personId ? relation.to_person : relation.from_person)}
                              </Typography>
                              {relation.notes && (
                                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                  "{relation.notes}"
                                </Typography>
                              )}
                            </Stack>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            size="small"
                            onClick={() => router.push(`/persons/${relation.from_person.id === personId ? relation.to_person.id : relation.from_person.id}`)}
                          >
                            <Visibility />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Sources Accordion */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Source />
                  <Typography variant="h6">
                    Quellen ({sources.length})
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {sources.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    Keine Quellen verfügbar
                  </Typography>
                ) : (
                  <List>
                    {sources.map((source) => (
                      <ListItem key={source.id} divider>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="subtitle1">
                                {source.title}
                              </Typography>
                              {source.reliability && (
                                <Chip
                                  label={`${Math.round(source.reliability * 100)}% Zuverlässigkeit`}
                                  color={getConfidenceColor(source.reliability) as any}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Stack>
                          }
                          secondary={
                            <Stack spacing={1}>
                              <Typography variant="body2" color="text.secondary">
                                {source.author && `${source.author} • `}{source.year}
                              </Typography>
                              {source.url && (
                                <Typography variant="body2" color="primary">
                                  {source.url}
                                </Typography>
                              )}
                              {source.usageCount && (
                                <Typography variant="body2" color="text.secondary">
                                  Verwendet in {source.usageCount} Beziehungen
                                </Typography>
                              )}
                            </Stack>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            size="small"
                            onClick={() => router.push(`/sources/${source.id}`)}
                          >
                            <Visibility />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </AccordionDetails>
            </Accordion>
          </Stack>

          {/* Edit Dialog */}
          <Dialog 
            open={showEditDialog} 
            onClose={() => setShowEditDialog(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Person bearbeiten</DialogTitle>
            <DialogContent>
              <PersonForm
                mode="edit"
                personId={personId}
                onClose={() => setShowEditDialog(false)}
                onResult={(result) => {
                  if (result.success) {
                    setShowEditDialog(false);
                    fetchPersonData();
                  }
                }}
              />
            </DialogContent>
          </Dialog>

          {/* Add Event Dialog */}
          <Dialog 
            open={showAddEventDialog} 
            onClose={() => setShowAddEventDialog(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Ereignis hinzufügen</DialogTitle>
            <DialogContent>
              <PersonEventForm
                personId={personId}
                onClose={() => setShowAddEventDialog(false)}
                onResult={(result) => {
                  if (result.success) {
                    setShowAddEventDialog(false);
                    fetchPersonEvents();
                  }
                }}
              />
            </DialogContent>
          </Dialog>

          {/* Add Relation Dialog */}
          <Dialog 
            open={showAddRelationDialog} 
            onClose={() => setShowAddRelationDialog(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Beziehung hinzufügen</DialogTitle>
            <DialogContent>
              <RelationshipForm
                fromPersonId={personId}
                onClose={() => setShowAddRelationDialog(false)}
                onResult={(result) => {
                  if (result.success) {
                    setShowAddRelationDialog(false);
                    fetchPersonRelations();
                  }
                }}
              />
            </DialogContent>
          </Dialog>
        </Container>
      </ErrorBoundary>
    </RequireAuth>
  );
}
