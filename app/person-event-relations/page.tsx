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
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Autocomplete,
} from '@mui/material';
import {
  Add,
  Search,
  People,
  Person,
  Event,
  TrendingUp,
  Edit,
  Delete,
  Visibility,
  Sort,
  FilterList,
  CalendarToday,
  Place,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import SiteHeader from '../components/layout/SiteHeader';
import { api } from '@/app/lib';
import { ErrorBoundary } from '../components/layout/ErrorBoundary';
import RequireAuth from '../components/layout/RequireAuth';
import { useProject } from '@/app/contexts/ProjectContext';

interface PersonEventRelation {
  id: number;
  person_id: number;
  event_id: number;
  relationship_type: string;
  statement_id?: number;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    name: string;
  };
  person: {
    id: number;
    first_name?: string;
    last_name?: string;
    birth_date?: string;
    death_date?: string;
  };
  event: {
    id: number;
    title: string;
    date?: string;
    location?: string;
  };
  statement?: {
    id: number;
    content: string;
    confidence?: number;
    source?: {
      id: number;
      title: string;
      author?: string;
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
  sourceCount: number;
  hasStatement: boolean;
  hasSources: boolean;
}

interface Person {
  id: number;
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  death_date?: string;
}

interface Event {
  id: number;
  title: string;
  date?: string;
  location?: string;
}

// Valid relationship types
const RELATIONSHIP_TYPES = [
  { value: 'participant', label: 'Teilnehmer', description: 'Hat an dem Ereignis teilgenommen' },
  { value: 'witness', label: 'Zeuge', description: 'Hat das Ereignis beobachtet' },
  { value: 'affected', label: 'Betroffener', description: 'War von dem Ereignis betroffen' },
  { value: 'organizer', label: 'Organisator', description: 'Hat das Ereignis organisiert' },
  { value: 'leader', label: 'Führer', description: 'Hat das Ereignis angeführt' },
  { value: 'member', label: 'Mitglied', description: 'War Mitglied bei dem Ereignis' },
  { value: 'supporter', label: 'Unterstützer', description: 'Hat das Ereignis unterstützt' },
  { value: 'opponent', label: 'Gegner', description: 'War gegen das Ereignis' },
  { value: 'victim', label: 'Opfer', description: 'War Opfer des Ereignisses' },
  { value: 'perpetrator', label: 'Täter', description: 'War Täter bei dem Ereignis' },
  { value: 'observer', label: 'Beobachter', description: 'Hat das Ereignis beobachtet' },
  { value: 'reporter', label: 'Berichterstatter', description: 'Hat über das Ereignis berichtet' },
  { value: 'beneficiary', label: 'Begünstigter', description: 'Hat von dem Ereignis profitiert' },
  { value: 'contributor', label: 'Beitragender', description: 'Hat zum Ereignis beigetragen' },
  { value: 'influencer', label: 'Einflussnehmer', description: 'Hat das Ereignis beeinflusst' },
  { value: 'follower', label: 'Anhänger', description: 'War Anhänger bei dem Ereignis' },
  { value: 'mentor', label: 'Mentor', description: 'War Mentor bei dem Ereignis' },
  { value: 'student', label: 'Schüler', description: 'War Schüler bei dem Ereignis' },
  { value: 'family_member', label: 'Familienmitglied', description: 'War Familienmitglied' },
  { value: 'colleague', label: 'Kollege', description: 'War Kollege bei dem Ereignis' },
  { value: 'friend', label: 'Freund', description: 'War Freund bei dem Ereignis' },
  { value: 'enemy', label: 'Feind', description: 'War Feind bei dem Ereignis' },
  { value: 'ally', label: 'Verbündeter', description: 'War Verbündeter bei dem Ereignis' },
  { value: 'rival', label: 'Rivale', description: 'War Rivale bei dem Ereignis' },
];

const getRelationshipColor = (relationType: string) => {
  const relation = RELATIONSHIP_TYPES.find(r => r.value === relationType);
  if (!relation) return 'default';
  
  // Color by category
  if (['participant', 'member', 'contributor'].includes(relationType)) return 'primary';
  if (['leader', 'organizer', 'influencer'].includes(relationType)) return 'secondary';
  if (['victim', 'affected'].includes(relationType)) return 'error';
  if (['witness', 'observer', 'reporter'].includes(relationType)) return 'info';
  if (['supporter', 'beneficiary'].includes(relationType)) return 'success';
  if (['opponent', 'enemy', 'rival'].includes(relationType)) return 'warning';
  
  return 'default';
};

export default function PersonEventRelationsPage() {
  const [relations, setRelations] = useState<PersonEventRelation[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterPerson, setFilterPerson] = useState('');
  const [filterEvent, setFilterEvent] = useState('');
  const [filterRelationType, setFilterRelationType] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedRelation, setSelectedRelation] = useState<PersonEventRelation | null>(null);
  
  const router = useRouter();
  const { selectedProject, isLoading: projectLoading } = useProject();

  const fetchRelations = async (page = 1) => {
    if (!selectedProject) {
      setRelations([]);
      setPagination({ page: 1, limit: 20, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        projectId: selectedProject.id,
      });
      
      if (search) {
        params.append('search', search);
      }
      
      if (filterPerson) {
        params.append('personId', filterPerson);
      }

      if (filterEvent) {
        params.append('eventId', filterEvent);
      }

      if (filterRelationType) {
        params.append('relationshipType', filterRelationType);
      }

      const data = await api.get(`/api/person-event-relations?${params}`);
      setRelations(Array.isArray(data.relations) ? data.relations : []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
    } catch (error) {
      console.error('Error fetching person-event relations:', error);
      setError('Failed to fetch person-event relations');
    } finally {
      setLoading(false);
    }
  };

  const fetchPersons = async () => {
    if (!selectedProject) return;
    
    try {
      const data = await api.get(`/api/persons?projectId=${selectedProject.id}&limit=100`);
      setPersons(Array.isArray(data.persons) ? data.persons : []);
    } catch (error) {
      console.error('Error fetching persons:', error);
    }
  };

  const fetchEvents = async () => {
    if (!selectedProject) return;
    
    try {
      const data = await api.get(`/api/events?projectId=${selectedProject.id}&limit=100`);
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  useEffect(() => {
    if (selectedProject && !projectLoading) {
      fetchRelations(1);
      fetchPersons();
      fetchEvents();
    }
  }, [selectedProject, projectLoading, search, filterPerson, filterEvent, filterRelationType]);

  const handlePageChange = (_: any, value: number) => {
    fetchRelations(value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleDeleteRelation = async (relationId: number) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Beziehung löschen möchten?')) {
      return;
    }

    try {
      await api.delete(`/api/person-event-relations/${relationId}`);
      fetchRelations(1); // Refresh the list
    } catch (error) {
      console.error('Error deleting relation:', error);
      setError('Failed to delete relation');
    }
  };

  const getPersonDisplayName = (person: Person) => {
    const name = `${person.first_name || ''} ${person.last_name || ''}`.trim();
    if (!name) return 'Unbekannt';
    
    let displayName = name;
    if (person.birth_date) {
      const birthYear = new Date(person.birth_date).getFullYear();
      if (person.death_date) {
        const deathYear = new Date(person.death_date).getFullYear();
        displayName += ` (${birthYear}-${deathYear})`;
      } else {
        displayName += ` (*${birthYear})`;
      }
    }
    
    return displayName;
  };

  const getRelationshipLabel = (relationType: string) => {
    const relation = RELATIONSHIP_TYPES.find(r => r.value === relationType);
    return relation ? relation.label : relationType;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading || projectLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <SiteHeader title="Person-Event Beziehungen" showOverline={false} />
        <Grid container spacing={3}>
          {[...Array(6)].map((_, index) => (
            // @ts-expect-error MUI Grid type workaround for Next.js 15
            <Grid item xs={12} md={6} key={index}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (!selectedProject) {
    return (
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <SiteHeader title="Person-Event Beziehungen" showOverline={false} />
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Kein Projekt ausgewählt
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Bitte wählen Sie ein Projekt aus, um Person-Event Beziehungen anzuzeigen, oder erstellen Sie ein neues Projekt.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => router.push('/account/projekte')}
          >
            Projekt erstellen
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <RequireAuth>
      <ErrorBoundary fallback={
        <Container maxWidth="lg" sx={{ mt: 6 }}>
          <SiteHeader title="Person-Event Beziehungen" showOverline={false} />
          <Alert severity="error" sx={{ my: 4 }}>
            Fehler beim Laden der Person-Event Beziehungen. Bitte versuchen Sie es später erneut.
            <Button color="inherit" size="small" onClick={() => window.location.reload()} sx={{ ml: 2 }}>
              Erneut versuchen
            </Button>
          </Alert>
        </Container>
      }>
        <Container maxWidth="lg" sx={{ mt: 6 }}>
          <SiteHeader title="Person-Event Beziehungen" showOverline={false} />
          
          {/* Project Header */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider' }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Projekt: {selectedProject.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedProject.description || 'Keine Beschreibung verfügbar'}
            </Typography>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
              <Button color="inherit" size="small" onClick={() => fetchRelations(1)} sx={{ ml: 2 }}>
                Erneut versuchen
              </Button>
            </Alert>
          )}
          
          {/* Controls */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  placeholder="Beziehungen durchsuchen..."
                  value={search}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
              <Grid item xs={12} md={2}>
                <Autocomplete
                  options={persons}
                  getOptionLabel={(option) => getPersonDisplayName(option)}
                  value={persons.find(p => p.id.toString() === filterPerson) || null}
                  onChange={(_, newValue) => setFilterPerson(newValue ? newValue.id.toString() : '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Person"
                      placeholder="Person auswählen..."
                    />
                  )}
                />
              </Grid>
              {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
              <Grid item xs={12} md={2}>
                <Autocomplete
                  options={events}
                  getOptionLabel={(option) => option.title}
                  value={events.find(e => e.id.toString() === filterEvent) || null}
                  onChange={(_, newValue) => setFilterEvent(newValue ? newValue.id.toString() : '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Event"
                      placeholder="Event auswählen..."
                    />
                  )}
                />
              </Grid>
              {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Beziehungstyp</InputLabel>
                  <Select
                    value={filterRelationType}
                    onChange={(e) => setFilterRelationType(e.target.value)}
                    label="Beziehungstyp"
                  >
                    <MenuItem value="">Alle</MenuItem>
                    {RELATIONSHIP_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
              <Grid item xs={12} md={3}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowCreateDialog(true)}
                  fullWidth
                >
                  Neue Beziehung
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Relations Grid */}
          {relations.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <People sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Keine Person-Event Beziehungen vorhanden
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Erstellen Sie Ihre erste Person-Event Beziehung, um Personen mit Ereignissen zu verknüpfen.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setShowCreateDialog(true)}
              >
                Erste Beziehung erstellen
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {relations.map((relation) => (
                // @ts-expect-error MUI Grid type workaround for Next.js 15
                <Grid item xs={12} md={6} key={relation.id}>
                  <Card>
                    <CardContent>
                      <Stack spacing={2}>
                        {/* Header */}
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" component="h3" gutterBottom>
                              {getPersonDisplayName(relation.person)} ↔ {relation.event.title}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                label={getRelationshipLabel(relation.relationship_type)}
                                color={getRelationshipColor(relation.relationship_type) as any}
                                size="small"
                                variant="outlined"
                              />
                            </Stack>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="Details anzeigen">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedRelation(relation);
                                  setShowDetailsDialog(true);
                                }}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedRelation(relation);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteRelation(relation.id)}
                            >
                              <Delete />
                            </IconButton>
                          </Stack>
                        </Box>

                        {/* Event Details */}
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CalendarToday fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {relation.event.date ? formatDate(relation.event.date) : 'Unbekanntes Datum'}
                          </Typography>
                          {relation.event.location && (
                            <>
                              <Place fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {relation.event.location}
                              </Typography>
                            </>
                          )}
                        </Stack>

                        {/* Statement */}
                        {relation.statement && (
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Aussage:
                            </Typography>
                            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                              "{relation.statement.content.length > 100 
                                ? `${relation.statement.content.substring(0, 100)}...`
                                : relation.statement.content
                              }"
                            </Typography>
                            {relation.statement.confidence && (
                              <Chip
                                label={`Vertrauen: ${Math.round(relation.statement.confidence * 100)}%`}
                                size="small"
                                color={relation.statement.confidence >= 0.8 ? 'success' : relation.statement.confidence >= 0.6 ? 'warning' : 'error'}
                                variant="outlined"
                                sx={{ mt: 1 }}
                              />
                            )}
                          </Box>
                        )}

                        {/* Sources */}
                        {relation.sourceOnRelations.length > 0 && (
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Quellen ({relation.sourceCount}):
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
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
                          </Box>
                        )}

                        {/* Usage Statistics */}
                        <Stack direction="row" spacing={2}>
                          {relation.hasStatement && (
                            <Chip
                              label="Mit Aussage"
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                          {relation.hasSources && (
                            <Chip
                              label={`${relation.sourceCount} Quellen`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          )}
                        </Stack>

                        {/* Created Date */}
                        <Typography variant="caption" color="text.secondary">
                          Erstellt: {formatDate(relation.created_at)}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
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
          )}

          {/* Create Dialog */}
          <Dialog 
            open={showCreateDialog} 
            onClose={() => setShowCreateDialog(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Neue Person-Event Beziehung erstellen</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Person-Event Beziehungen können über die Personen-Detailseiten erstellt werden.
              </Typography>
              <Button
                variant="contained"
                onClick={() => {
                  setShowCreateDialog(false);
                  router.push('/persons');
                }}
              >
                Zu den Personen
              </Button>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog 
            open={showEditDialog} 
            onClose={() => {
              setShowEditDialog(false);
              setSelectedRelation(null);
            }}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Beziehung bearbeiten</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Person-Event Beziehungen können über die Personen-Detailseiten bearbeitet werden.
              </Typography>
              {selectedRelation && (
                <Button
                  variant="contained"
                  onClick={() => {
                    setShowEditDialog(false);
                    router.push(`/persons/${selectedRelation.person.id}`);
                  }}
                >
                  Zu {getPersonDisplayName(selectedRelation.person)}
                </Button>
              )}
            </DialogContent>
          </Dialog>

          {/* Details Dialog */}
          <Dialog 
            open={showDetailsDialog} 
            onClose={() => {
              setShowDetailsDialog(false);
              setSelectedRelation(null);
            }}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Beziehungsdetails</DialogTitle>
            <DialogContent>
              {selectedRelation && (
                <Stack spacing={3}>
                  {/* Relationship */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Beziehung:
                    </Typography>
                    <Typography variant="h6">
                      {getPersonDisplayName(selectedRelation.person)} ↔ {selectedRelation.event.title}
                    </Typography>
                    <Chip
                      label={getRelationshipLabel(selectedRelation.relationship_type)}
                      color={getRelationshipColor(selectedRelation.relationship_type) as any}
                      sx={{ mt: 1 }}
                    />
                  </Box>

                  {/* Event Details */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Ereignis:
                    </Typography>
                    <Typography variant="body1">
                      {selectedRelation.event.title}
                    </Typography>
                    {selectedRelation.event.date && (
                      <Typography variant="body2" color="text.secondary">
                        Datum: {formatDate(selectedRelation.event.date)}
                      </Typography>
                    )}
                    {selectedRelation.event.location && (
                      <Typography variant="body2" color="text.secondary">
                        Ort: {selectedRelation.event.location}
                      </Typography>
                    )}
                  </Box>

                  {/* Statement */}
                  {selectedRelation.statement && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Aussage:
                      </Typography>
                      <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                        "{selectedRelation.statement.content}"
                      </Typography>
                      {selectedRelation.statement.confidence && (
                        <Chip
                          label={`Vertrauen: ${Math.round(selectedRelation.statement.confidence * 100)}%`}
                          color={selectedRelation.statement.confidence >= 0.8 ? 'success' : selectedRelation.statement.confidence >= 0.6 ? 'warning' : 'error'}
                          sx={{ mt: 1 }}
                        />
                      )}
                      {selectedRelation.statement.source && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Quelle: {selectedRelation.statement.source.title}
                          {selectedRelation.statement.source.author && ` - ${selectedRelation.statement.source.author}`}
                        </Typography>
                      )}
                    </Box>
                  )}

                  {/* Sources */}
                  {selectedRelation.sourceOnRelations.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Quellen ({selectedRelation.sourceCount}):
                      </Typography>
                      <List dense>
                        {selectedRelation.sourceOnRelations.map((sourceRel) => (
                          <ListItem key={sourceRel.id} divider>
                            <ListItemText
                              primary={sourceRel.source.title}
                              secondary={`${sourceRel.source.author || 'Unbekannter Autor'}${sourceRel.source.year ? ` (${sourceRel.source.year})` : ''}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {/* Metadata */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Metadaten:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Erstellt: {formatDate(selectedRelation.created_at)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Aktualisiert: {formatDate(selectedRelation.updated_at)}
                    </Typography>
                  </Box>
                </Stack>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowDetailsDialog(false)}>
                Schließen
              </Button>
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => {
                  setShowDetailsDialog(false);
                  setShowEditDialog(true);
                }}
              >
                Bearbeiten
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </ErrorBoundary>
    </RequireAuth>
  );
}
