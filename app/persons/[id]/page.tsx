'use client';

import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import LifeEventForm from '../../components/LifeEventForm';
import RelationshipForm from '../../components/RelationshipForm';
import RelationshipNetwork from '../../components/RelationshipNetwork';
import { 
  Container, 
  Box, 
  Typography, 
  Button, 
  Snackbar, 
  Alert,  
  IconButton, 
  Stack, 
  Menu, 
  MenuItem, 
  Skeleton, 
  Paper, 
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
  Fab,
  Tooltip,
  Tabs,
  Tab,
  Badge,
  IconButton as MuiIconButton,
  Drawer
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useRouter, useParams } from 'next/navigation';
import { 
  ChevronLeft, 
  MoreVert, 
  Add, 
  Edit, 
  Delete, 
  Event, 
  Timeline, 
  List, 
  People, 
  Close,
  PersonAdd,
  Link,
  Person,
  LocationOn,
  FamilyRestroom,
  AccessTime,
  Place,
  CalendarToday,
} from '@mui/icons-material';
import SiteHeader from '../../components/SiteHeader';
import PersonForm from '../../components/PersonForm';

interface LifeEvent {
  id: number;
  title: string;
  start_date: string;
  end_date?: string;
  location?: string;
  description?: string;
  event?: {
    id: number;
    title: string;
  };
}

interface Person {
  id: number;
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  birth_place?: string;
  death_date?: string;
  death_place?: string;
  notes?: string;
}

interface Relationship {
  id: number;
  personId: number;
  personName: string;
  relationType: string;
  isOutgoing: boolean;
  notes?: string;
  otherPerson: {
    id: number;
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    deathDate?: string;
  };
}

interface RelationshipFormData {
  id?: number;
  fromPersonId: number;
  toPersonId: number;
  relationType: string;
  notes?: string;
}

export default function PersonDetailPage() {
  const params = useParams();
  const personId = Number(params.id);
  const router = useRouter();
  const [person, setPerson] = useState<Person | null>(null);
  const [lifeEvents, setLifeEvents] = useState<LifeEvent[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [allPersons, setAllPersons] = useState<Person[]>([]);
  const [showLifeEventForm, setShowLifeEventForm] = useState(false);
  const [showRelationshipForm, setShowRelationshipForm] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<Relationship | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
  const [activeTab, setActiveTab] = useState(0);

  // Fetch person data
  const fetchPersonData = useCallback(async () => {
    try {
      const resPerson = await fetch(`/api/persons/${personId}`);
      if (resPerson.ok) {
        const personData = await resPerson.json();
        setPerson(personData);
      } else {
        console.error('Failed to fetch person data');
        setPerson(null);
      }
    } catch (error) {
      console.error('Error fetching person data:', error);
      setPerson(null);
    }
  }, [personId]);

  const fetchLifeEvents = useCallback(async () => {
    try {
      const res = await fetch(`/api/life-events?personId=${personId}`);
      if (!res.ok) {
        console.error('Failed to fetch life events');
        setLifeEvents([]);
        return;
      }
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        console.error('Error parsing life events response:', e);
        data = [];
      }
      
      // Ensure data is always an array
      const eventsArray = Array.isArray(data) ? data : [];
      setLifeEvents(eventsArray);
    } catch (error) {
      console.error('Error fetching life events:', error);
      setLifeEvents([]);
    }
  }, [personId]);

  const fetchRelationships = useCallback(async () => {
    try {
      const res = await fetch(`/api/person-relations?personId=${personId}`);
      if (res.ok) {
        const data = await res.json();
        setRelationships(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch relationships');
        setRelationships([]);
      }
    } catch (error) {
      console.error('Error fetching relationships:', error);
      setRelationships([]);
    }
  }, [personId]);

  const fetchAllPersons = useCallback(async () => {
    try {
      const res = await fetch('/api/persons');
      if (res.ok) {
        const data = await res.json();
        setAllPersons(Array.isArray(data.persons) ? data.persons : []);
      } else {
        console.error('Failed to fetch all persons');
        setAllPersons([]);
      }
    } catch (error) {
      console.error('Error fetching all persons:', error);
      setAllPersons([]);
    }
  }, []);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      try {
        await Promise.all([
          fetchPersonData(),
          fetchLifeEvents(),
          fetchRelationships(),
          fetchAllPersons()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (personId && !isNaN(personId)) {
      fetchAll();
    }
  }, [personId, fetchPersonData, fetchLifeEvents, fetchRelationships, fetchAllPersons]);

  const SnackBarAction = () => {
    if (activeTab === 0) {
      setShowLifeEventForm(true);
    } else {
      setShowRelationshipForm(true);
    }
    setSnackbarOpen(false);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, id: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    if (selectedId) setShowLifeEventForm(true);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedId) {
      const res = await fetch(`/api/life-events/${selectedId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLifeEvents();
        setSnackbarMsg('Lebensereignis erfolgreich gelöscht');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        setSnackbarMsg('Fehler beim Löschen des Lebensereignisses');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
    handleMenuClose();
    setSelectedId(null); 
  };

  const handleAddRelationship = () => {
    setEditingRelationship(null);
    setShowRelationshipForm(true);
  };

  const handleEditRelationship = (relationship: Relationship) => {
    setEditingRelationship(relationship);
    setShowRelationshipForm(true);
  };

  const handleDeleteRelationship = async (relationshipId: number) => {
    const res = await fetch(`/api/person-relations/${relationshipId}`, { method: 'DELETE' });
    if (res.ok) {
      fetchRelationships();
      setSnackbarMsg('Beziehung erfolgreich gelöscht');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } else {
      setSnackbarMsg('Fehler beim Löschen der Beziehung');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleRelationshipSubmit = async (relationshipData: RelationshipFormData) => {
    try {
      const url = editingRelationship 
        ? `/api/person-relations/${editingRelationship.id}`
        : '/api/person-relations';
      
      const method = editingRelationship ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(relationshipData)
      });

      if (res.ok) {
        fetchRelationships();
        setSnackbarMsg(
          editingRelationship 
            ? 'Beziehung erfolgreich aktualisiert' 
            : 'Beziehung erfolgreich erstellt'
        );
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setShowRelationshipForm(false);
        setEditingRelationship(null);
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Fehler beim Speichern der Beziehung');
      }
    } catch (error) {
      setSnackbarMsg(error instanceof Error ? error.message : 'Fehler beim Speichern der Beziehung');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getAge = (birthDate: string, deathDate?: string) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const end = deathDate ? new Date(deathDate) : new Date();
    const age = end.getFullYear() - birth.getFullYear();
    const monthDiff = end.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const sortedLifeEvents = [...lifeEvents].sort((a, b) => {
    const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
    const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
    return dateA - dateB;
  });

  if (loading) {
    return (
      <Container sx={{ mt: 6 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Skeleton variant="circular" width={64} height={64} />
          <Skeleton variant="text" width={220} height={48} />
        </Stack>
        <Paper sx={{ mt: 4, p: 3, maxWidth: 600 }}>
          <Grid container spacing={2}>
            {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
            <Grid item xs={4}><Skeleton width={80} /></Grid>
            {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
            <Grid item xs={8}><Skeleton width={180} /></Grid>
            {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
            <Grid item xs={4}><Skeleton width={80} /></Grid>
            {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
            <Grid item xs={8}><Skeleton width={180} /></Grid>
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
        <Box sx={{ width: '100%', mt: 4 }}>
          <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
            <Skeleton variant="text" width={200} height={40} />
            <Skeleton variant="rectangular" width={250} height={40} />
          </Stack>
          <Box sx={{ mt: 2 }}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={56} sx={{ mb: 1 }} />
            ))}
          </Box>
        </Box>
      </Container>
    );
  }

  const personName = `${person?.first_name || 'Unbekannt'} ${person?.last_name || ''}`.trim();
  const age = person?.birth_date ? getAge(person.birth_date, person?.death_date) : null;

  return (
    <Container maxWidth="lg" sx={{ mt: 6 }}>
      <SiteHeader
        title={personName}
        showOverline={true}
        overline="Zurück zur Personenübersicht"
      />
      
      {/* Person Info Card */}
      <Paper sx={{ mt: 4, p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
          <Grid item xs={12} md={8}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h4" component="h1" gutterBottom>
                  {personName}
                </Typography>
                {age !== null && (
                  <Chip 
                    label={`${age} Jahre`} 
                    color="primary" 
                    variant="outlined" 
                    size="small"
                    sx={{ mb: 1 }}
                  />
                )}
              </Box>
              
              <Grid container spacing={2}>
                {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CalendarToday color="action" fontSize="small" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Geboren
                      </Typography>
                      <Typography variant="body1">
                        {formatDate(person?.birth_date || '')}
                        {person?.birth_place && ` in ${person.birth_place}`}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                {person?.death_date && (
                  // @ts-expect-error MUI Grid type workaround for Next.js 15
                  <Grid item xs={12} sm={6}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CalendarToday color="action" fontSize="small" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Gestorben
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(person.death_date)}
                          {person?.death_place && ` in ${person.death_place}`}
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                )}
              </Grid>
              
              {person?.notes && (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Notizen
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                    {person.notes}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Grid>
          {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
          <Grid item xs={12} md={4}>
            <Stack spacing={2} alignItems="flex-end">
              <Button
                variant="outlined"
                startIcon={<Edit />}
                onClick={() => setDrawerOpen(true)}
              >
                Bearbeiten
              </Button>
              
              <Stack spacing={1} alignItems="center">
                <Box textAlign="center">
                  <Typography variant="h6" color="primary">
                    {lifeEvents.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Lebensereignisse
                  </Typography>
                </Box>
                
                <Divider sx={{ width: '100%' }} />
                
                <Box textAlign="center">
                  <Typography variant="h6" color="secondary">
                    {relationships.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Beziehungen
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Box sx={{ width: '100%', mb: 4 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab 
            icon={<Timeline />} 
            label={`Lebensereignisse (${lifeEvents.length})`}
            iconPosition="start"
          />
          <Tab 
            icon={<FamilyRestroom />} 
            label={`Beziehungen (${relationships.length})`}
            iconPosition="start"
          />
        </Tabs>

        {/* Life Events Tab */}
        {activeTab === 0 && (
          <Box>
            <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Box>
                <Typography variant="h5" gutterBottom>
                  Lebensereignisse
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {lifeEvents.length} Ereignisse in der Lebensgeschichte
                </Typography>
              </Box>
              
              <Stack direction="row" spacing={1}>
                <Tabs 
                  value={viewMode} 
                  onChange={(_, newValue) => setViewMode(newValue)}
                >
                  <Tab 
                    value="timeline" 
                    icon={<Timeline />} 
                    label="Timeline"
                    iconPosition="start"
                  />
                  <Tab 
                    value="list" 
                    icon={<List />} 
                    label="Liste"
                    iconPosition="start"
                  />
                </Tabs>
                
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => {
                    setSelectedId(null);
                    setShowLifeEventForm(true);
                  }}
                >
                  Neues Ereignis
                </Button>
              </Stack>
            </Stack>

            {lifeEvents.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Event sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Keine Lebensereignisse vorhanden
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Fügen Sie das erste Lebensereignis hinzu, um die Lebensgeschichte zu dokumentieren.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => {
                    setSelectedId(null);
                    setShowLifeEventForm(true);
                  }}
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
                    bgcolor: 'primary.main',
                    transform: 'translateX(-50%)',
                    zIndex: 1,
                  }}
                />
                
                <Stack spacing={3}>
                  {sortedLifeEvents.map((event, index) => (
                    <Box
                      key={event.id}
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
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          border: 2,
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
                              <Typography variant="h6" component="span">
                                {event.title}
                              </Typography>
                              
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {formatDate(event.start_date)}
                                {event.end_date && event.end_date !== event.start_date && (
                                  ` - ${formatDate(event.end_date)}`
                                )}
                              </Typography>
                              
                              {event.location && (
                                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 1 }}>
                                  <LocationOn fontSize="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    {event.location}
                                  </Typography>
                                </Stack>
                              )}
                              
                              {event.description && (
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  {event.description}
                                </Typography>
                              )}
                              
                              {event.event && (
                                <Chip 
                                  label={`Verwandt mit: ${event.event.title}`}
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                  sx={{ mt: 1 }}
                                />
                              )}
                            </Box>
                            
                            <IconButton 
                              size="small"
                              onClick={(e) => handleMenuOpen(e, event.id)}
                            >
                              <MoreVert />
                            </IconButton>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Box>
                  ))}
                </Stack>
              </Box>
            ) : (
              <Stack spacing={2}>
                {sortedLifeEvents.map((event) => (
                  <Card key={event.id}>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" gutterBottom>
                            {event.title}
                          </Typography>
                          
                          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <AccessTime fontSize="small" color="action" />
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(event.start_date)}
                                {event.end_date && event.end_date !== event.start_date && (
                                  ` - ${formatDate(event.end_date)}`
                                )}
                              </Typography>
                            </Stack>
                            
                            {event.location && (
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <Place fontSize="small" color="action" />
                                <Typography variant="body2" color="text.secondary">
                                  {event.location}
                                </Typography>
                              </Stack>
                            )}
                          </Stack>
                          
                          {event.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {event.description}
                            </Typography>
                          )}
                          
                          {event.event && (
                            <Chip 
                              label={`Verwandt mit: ${event.event.title}`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        
                        <IconButton 
                          size="small"
                          onClick={(e) => handleMenuOpen(e, event.id)}
                        >
                          <MoreVert />
                        </IconButton>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        )}

        {/* Relationships Tab */}
        {activeTab === 1 && (
          <Box>
            <RelationshipNetwork
              currentPerson={person!}
              relationships={relationships}
              onAddRelationship={handleAddRelationship}
              onEditRelationship={handleEditRelationship}
              onDeleteRelationship={handleDeleteRelationship}
              loading={loading}
            />
          </Box>
        )}
      </Box>

      {/* Context Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>
          <Edit sx={{ mr: 1 }} />
          Bearbeiten
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Löschen
        </MenuItem>
      </Menu>

      {/* Life Event Form Drawer */}
      <Drawer
        anchor="right"
        open={showLifeEventForm}
        onClose={() => {
          setShowLifeEventForm(false);
          setSelectedId(null);
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: '500px',
            padding: 2,
          },
          zIndex: 1299,
        }}
      >
        <LifeEventForm
          mode={selectedId ? "edit" : "create"}
          lifeEventId={selectedId || undefined}
          personId={personId}
          onCloseAction={() => setShowLifeEventForm(false)}
          onSuccessAction={(message: string) => {
            setSnackbarMsg(message);
            setSnackbarSeverity('success');
            setSnackbarOpen(true);
            setShowLifeEventForm(false);
            setSelectedId(null);
            fetchLifeEvents();
          }}
          onErrorAction={(message: string) => {
            setSnackbarMsg(message);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
          }}
        />
      </Drawer>

      {/* Relationship Form Dialog */}
      <RelationshipForm
        open={showRelationshipForm}
        onClose={() => {
          setShowRelationshipForm(false);
          setEditingRelationship(null);
        }}
        onSubmit={handleRelationshipSubmit}
        currentPerson={person!}
        existingRelationship={editingRelationship ? {
          id: editingRelationship.id,
          fromPersonId: editingRelationship.isOutgoing ? person!.id : editingRelationship.otherPerson.id,
          toPersonId: editingRelationship.isOutgoing ? editingRelationship.otherPerson.id : person!.id,
          relationType: editingRelationship.relationType,
          notes: editingRelationship.notes
        } : undefined}
        loading={loading}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity={snackbarSeverity}
          onClose={() => setSnackbarOpen(false)}
          sx={{ width: '100%' }}
          action={
            <Button color="inherit" size="small" onClick={() => SnackBarAction()}>
              Weiteres erstellen
            </Button>
          }
        >
          {snackbarMsg}
        </Alert>
      </Snackbar>

      {/* Person Form Drawer */}
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
        <PersonForm
          mode="edit"
          personId={personId}
          onClose={() => setDrawerOpen(false)}
          onResult={(result) => {
            setSnackbarMsg(result.message);
            setSnackbarSeverity(result.success ? 'success' : 'error');
            setSnackbarOpen(true);
            setDrawerOpen(false);
            // Refresh person data
            if (result.success) {
              setLoading(true);
              fetchPersonData();
            }
          }}
        />
      </Drawer>
    </Container>
  );
}
