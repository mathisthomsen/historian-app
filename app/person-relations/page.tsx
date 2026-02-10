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
  FamilyRestroom,
  Edit,
  Delete,
  Visibility,
  Sort,
  FilterList,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import SiteHeader from '../components/layout/SiteHeader';
import { api } from '../lib';
import { ErrorBoundary } from '../components/layout/ErrorBoundary';
import RequireAuth from '../components/layout/RequireAuth';
import { useProject } from '../contexts/ProjectContext';

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

interface Person {
  id: number;
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  death_date?: string;
}

// Relationship types with German labels
const RELATIONSHIP_TYPES = [
  { value: 'father', label: 'Vater', category: 'family' },
  { value: 'mother', label: 'Mutter', category: 'family' },
  { value: 'son', label: 'Sohn', category: 'family' },
  { value: 'daughter', label: 'Tochter', category: 'family' },
  { value: 'brother', label: 'Bruder', category: 'family' },
  { value: 'sister', label: 'Schwester', category: 'family' },
  { value: 'husband', label: 'Ehemann', category: 'marriage' },
  { value: 'wife', label: 'Ehefrau', category: 'marriage' },
  { value: 'spouse', label: 'Ehepartner', category: 'marriage' },
  { value: 'grandfather', label: 'Großvater', category: 'family' },
  { value: 'grandmother', label: 'Großmutter', category: 'family' },
  { value: 'grandson', label: 'Enkel', category: 'family' },
  { value: 'granddaughter', label: 'Enkelin', category: 'family' },
  { value: 'uncle', label: 'Onkel', category: 'family' },
  { value: 'aunt', label: 'Tante', category: 'family' },
  { value: 'nephew', label: 'Neffe', category: 'family' },
  { value: 'niece', label: 'Nichte', category: 'family' },
  { value: 'cousin', label: 'Cousin/Cousine', category: 'family' },
  { value: 'colleague', label: 'Kollege', category: 'professional' },
  { value: 'boss', label: 'Vorgesetzter', category: 'professional' },
  { value: 'employee', label: 'Mitarbeiter', category: 'professional' },
  { value: 'mentor', label: 'Mentor', category: 'professional' },
  { value: 'mentee', label: 'Mentee', category: 'professional' },
  { value: 'teacher', label: 'Lehrer', category: 'professional' },
  { value: 'student', label: 'Schüler', category: 'professional' },
  { value: 'friend', label: 'Freund', category: 'other' },
  { value: 'neighbor', label: 'Nachbar', category: 'other' },
  { value: 'acquaintance', label: 'Bekannter', category: 'other' },
  { value: 'business_partner', label: 'Geschäftspartner', category: 'other' },
  { value: 'rival', label: 'Rivale', category: 'other' },
  { value: 'enemy', label: 'Feind', category: 'other' },
];

const getRelationshipCategoryColor = (category: string) => {
  switch (category) {
    case 'family': return 'primary';
    case 'marriage': return 'secondary';
    case 'professional': return 'success';
    case 'other': return 'default';
    default: return 'default';
  }
};

const getRelationshipCategoryIcon = (category: string) => {
  switch (category) {
    case 'family': return <FamilyRestroom />;
    case 'marriage': return <People />;
    case 'professional': return <Person />;
    case 'other': return <People />;
    default: return <People />;
  }
};

export default function PersonRelationsPage() {
  const [relations, setRelations] = useState<PersonRelation[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterPerson, setFilterPerson] = useState('');
  const [filterRelationType, setFilterRelationType] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedRelation, setSelectedRelation] = useState<PersonRelation | null>(null);
  
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

      if (filterRelationType) {
        params.append('relationType', filterRelationType);
      }

      const data = await api.get(`/api/person-relations?${params}`);
      setRelations(Array.isArray(data) ? data : []);
      setPagination({ page: 1, limit: 20, total: data.length || 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
    } catch (error) {
      console.error('Error fetching person relations:', error);
      setError('Failed to fetch person relations');
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

  useEffect(() => {
    if (selectedProject && !projectLoading) {
      fetchRelations(1);
      fetchPersons();
    }
  }, [selectedProject, projectLoading, search, filterPerson, filterRelationType]);

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
      await api.delete(`/api/person-relations/${relationId}`);
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

  const getRelationshipCategory = (relationType: string) => {
    const relation = RELATIONSHIP_TYPES.find(r => r.value === relationType);
    return relation ? relation.category : 'other';
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
        <SiteHeader title="Personen-Beziehungen" showOverline={false} />
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
        <SiteHeader title="Personen-Beziehungen" showOverline={false} />
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Kein Projekt ausgewählt
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Bitte wählen Sie ein Projekt aus, um Personen-Beziehungen anzuzeigen, oder erstellen Sie ein neues Projekt.
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
          <SiteHeader title="Personen-Beziehungen" showOverline={false} />
          <Alert severity="error" sx={{ my: 4 }}>
            Fehler beim Laden der Personen-Beziehungen. Bitte versuchen Sie es später erneut.
            <Button color="inherit" size="small" onClick={() => window.location.reload()} sx={{ ml: 2 }}>
              Erneut versuchen
            </Button>
          </Alert>
        </Container>
      }>
        <Container maxWidth="lg" sx={{ mt: 6 }}>
          <SiteHeader title="Personen-Beziehungen" showOverline={false} />
          
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
              <Grid item xs={12} md={3}>
                <Autocomplete
                  options={persons}
                  getOptionLabel={(option) => getPersonDisplayName(option)}
                  value={persons.find(p => p.id.toString() === filterPerson) || null}
                  onChange={(_, newValue) => setFilterPerson(newValue ? newValue.id.toString() : '')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Person filtern"
                      placeholder="Person auswählen..."
                    />
                  )}
                />
              </Grid>
              {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
              <Grid item xs={12} md={3}>
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
                Keine Personen-Beziehungen vorhanden
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Erstellen Sie Ihre erste Personen-Beziehung, um das Netzwerk zu erweitern.
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
              {relations.map((relation) => {
                const category = getRelationshipCategory(relation.relation_type);
                const categoryColor = getRelationshipCategoryColor(category);
                const categoryIcon = getRelationshipCategoryIcon(category);
                
                return (
                  // @ts-expect-error MUI Grid type workaround for Next.js 15
                  <Grid item xs={12} md={6} key={relation.id}>
                    <Card>
                      <CardContent>
                        <Stack spacing={2}>
                          {/* Header */}
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" component="h3" gutterBottom>
                                {getPersonDisplayName(relation.from_person)} ↔ {getPersonDisplayName(relation.to_person)}
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                {categoryIcon}
                                <Chip
                                  label={getRelationshipLabel(relation.relation_type)}
                                  color={categoryColor as any}
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

                          {/* Notes */}
                          {relation.notes && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                              "{relation.notes}"
                            </Typography>
                          )}

                          {/* Person Details */}
                          <Stack direction="row" spacing={2}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Von:
                              </Typography>
                              <Typography variant="body2">
                                {getPersonDisplayName(relation.from_person)}
                              </Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Zu:
                              </Typography>
                              <Typography variant="body2">
                                {getPersonDisplayName(relation.to_person)}
                              </Typography>
                            </Box>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
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
            <DialogTitle>Neue Personen-Beziehung erstellen</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Personen-Beziehungen können über die Personen-Detailseiten erstellt werden.
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
                Personen-Beziehungen können über die Personen-Detailseiten bearbeitet werden.
              </Typography>
              {selectedRelation && (
                <Button
                  variant="contained"
                  onClick={() => {
                    setShowEditDialog(false);
                    router.push(`/persons/${selectedRelation.from_person.id}`);
                  }}
                >
                  Zu {getPersonDisplayName(selectedRelation.from_person)}
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
                      {getPersonDisplayName(selectedRelation.from_person)} ↔ {getPersonDisplayName(selectedRelation.to_person)}
                    </Typography>
                    <Chip
                      label={getRelationshipLabel(selectedRelation.relation_type)}
                      color={getRelationshipCategoryColor(getRelationshipCategory(selectedRelation.relation_type)) as any}
                      sx={{ mt: 1 }}
                    />
                  </Box>

                  {/* Notes */}
                  {selectedRelation.notes && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Notizen:
                      </Typography>
                      <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                        {selectedRelation.notes}
                      </Typography>
                    </Box>
                  )}

                  {/* Person Details */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Personeninformationen:
                    </Typography>
                    <Grid container spacing={2}>
                      {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Von:</strong> {getPersonDisplayName(selectedRelation.from_person)}
                        </Typography>
                        {selectedRelation.from_person.birth_date && (
                          <Typography variant="body2" color="text.secondary">
                            Geboren: {formatDate(selectedRelation.from_person.birth_date)}
                          </Typography>
                        )}
                        {selectedRelation.from_person.death_date && (
                          <Typography variant="body2" color="text.secondary">
                            Gestorben: {formatDate(selectedRelation.from_person.death_date)}
                          </Typography>
                        )}
                      </Grid>
                      {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Zu:</strong> {getPersonDisplayName(selectedRelation.to_person)}
                        </Typography>
                        {selectedRelation.to_person.birth_date && (
                          <Typography variant="body2" color="text.secondary">
                            Geboren: {formatDate(selectedRelation.to_person.birth_date)}
                          </Typography>
                        )}
                        {selectedRelation.to_person.death_date && (
                          <Typography variant="body2" color="text.secondary">
                            Gestorben: {formatDate(selectedRelation.to_person.death_date)}
                          </Typography>
                        )}
                      </Grid>
                    </Grid>
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
