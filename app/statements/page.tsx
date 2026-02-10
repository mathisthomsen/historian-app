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
} from '@mui/material';
import {
  Add,
  Search,
  Message,
  Person,
  Event,
  Source,
  TrendingUp,
  Edit,
  Delete,
  Visibility,
  FilterList,
  Sort,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import SiteHeader from '../components/layout/SiteHeader';
import { api } from '../lib';
import { ErrorBoundary } from '../components/layout/ErrorBoundary';
import RequireAuth from '../components/layout/RequireAuth';
import { useProject } from '../contexts/ProjectContext';
import StatementForm from '../components/forms/StatementForm';

interface Statement {
  id: number;
  content: string;
  confidence?: number;
  source_id?: number;
  created_at: string;
  updated_at: string;
  project?: {
    id: string;
    name: string;
  };
  source?: {
    id: number;
    title: string;
    author?: string;
    year?: number;
  };
  personEventRelations: Array<{
    id: number;
    relationship_type: string;
    person: {
      id: number;
      first_name?: string;
      last_name?: string;
    };
    event: {
      id: number;
      title: string;
      date?: string;
    };
  }>;
  relationCount: number;
  hasRelations: boolean;
}

export default function StatementsPage() {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterConfidence, setFilterConfidence] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedStatement, setSelectedStatement] = useState<Statement | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  
  const router = useRouter();
  const { selectedProject, isLoading: projectLoading } = useProject();

  const fetchStatements = async (page = 1) => {
    if (!selectedProject) {
      setStatements([]);
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
      
      if (sortField) {
        params.append('sortField', sortField);
        params.append('sortOrder', sortOrder);
      }

      if (filterConfidence) {
        params.append('confidence', filterConfidence);
      }

      if (filterSource) {
        params.append('sourceId', filterSource);
      }

      const data = await api.get(`/api/statements?${params}`);
      setStatements(Array.isArray(data.statements) ? data.statements : []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
    } catch (error) {
      console.error('Error fetching statements:', error);
      setError('Failed to fetch statements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProject && !projectLoading) {
      fetchStatements(1);
    }
  }, [selectedProject, projectLoading, search, sortField, sortOrder, filterConfidence, filterSource]);

  const handlePageChange = (_: any, value: number) => {
    fetchStatements(value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSortChange = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleCreateStatement = (result: { success: boolean; message: string; statement?: any }) => {
    if (result.success) {
      setShowCreateDialog(false);
      fetchStatements(1); // Refresh the list
    }
  };

  const handleEditStatement = (result: { success: boolean; message: string; statement?: any }) => {
    if (result.success) {
      setShowEditDialog(false);
      setSelectedStatement(null);
      fetchStatements(1); // Refresh the list
    }
  };

  const handleDeleteStatement = async (statementId: number) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Aussage löschen möchten?')) {
      return;
    }

    try {
      await api.delete(`/api/statements/${statementId}`);
      fetchStatements(1); // Refresh the list
    } catch (error) {
      console.error('Error deleting statement:', error);
      setError('Failed to delete statement');
    }
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || projectLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <SiteHeader title="Aussagen" showOverline={false} />
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
        <SiteHeader title="Aussagen" showOverline={false} />
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Kein Projekt ausgewählt
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Bitte wählen Sie ein Projekt aus, um Aussagen anzuzeigen, oder erstellen Sie ein neues Projekt.
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
          <SiteHeader title="Aussagen" showOverline={false} />
          <Alert severity="error" sx={{ my: 4 }}>
            Fehler beim Laden der Aussagen. Bitte versuchen Sie es später erneut.
            <Button color="inherit" size="small" onClick={() => window.location.reload()} sx={{ ml: 2 }}>
              Erneut versuchen
            </Button>
          </Alert>
        </Container>
      }>
        <Container maxWidth="lg" sx={{ mt: 6 }}>
          <SiteHeader title="Aussagen" showOverline={false} />
          
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
              <Button color="inherit" size="small" onClick={() => fetchStatements(1)} sx={{ ml: 2 }}>
                Erneut versuchen
              </Button>
            </Alert>
          )}
          
          {/* Controls */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Aussagen durchsuchen..."
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
                <FormControl fullWidth>
                  <InputLabel>Sortieren nach</InputLabel>
                  <Select
                    value={sortField}
                    onChange={(e) => handleSortChange(e.target.value)}
                    label="Sortieren nach"
                  >
                    <MenuItem value="created_at">Erstellt</MenuItem>
                    <MenuItem value="content">Inhalt</MenuItem>
                    <MenuItem value="confidence">Vertrauen</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Vertrauen</InputLabel>
                  <Select
                    value={filterConfidence}
                    onChange={(e) => setFilterConfidence(e.target.value)}
                    label="Vertrauen"
                  >
                    <MenuItem value="">Alle</MenuItem>
                    <MenuItem value="high">Hoch (over 80%)</MenuItem>
                    <MenuItem value="medium">Mittel (60-79%)</MenuItem>
                    <MenuItem value="low">Niedrig (under 60%)</MenuItem>
                    <MenuItem value="unknown">Unbekannt</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
              <Grid item xs={12} md={2}>
                <Button
                  variant="outlined"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  fullWidth
                  startIcon={<Sort />}
                >
                  {sortOrder === 'asc' ? '↑ Aufsteigend' : '↓ Absteigend'}
                </Button>
              </Grid>
              {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
              <Grid item xs={12} md={2}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowCreateDialog(true)}
                  fullWidth
                >
                  Neue Aussage
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Statements Grid */}
          {statements.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Message sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Keine Aussagen vorhanden
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Erstellen Sie Ihre erste Aussage, um mit der Dokumentation zu beginnen.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setShowCreateDialog(true)}
              >
                Erste Aussage erstellen
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {statements.map((statement) => (
                // @ts-expect-error MUI Grid type workaround for Next.js 15
                <Grid item xs={12} md={6} key={statement.id}>
                  <Card>
                    <CardContent>
                      <Stack spacing={2}>
                        {/* Header */}
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Typography variant="body1" sx={{ flex: 1, fontWeight: 'medium' }}>
                            {statement.content.length > 150 
                              ? `${statement.content.substring(0, 150)}...`
                              : statement.content
                            }
                          </Typography>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="Details anzeigen">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedStatement(statement);
                                  setShowDetailsDialog(true);
                                }}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedStatement(statement);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteStatement(statement.id)}
                            >
                              <Delete />
                            </IconButton>
                          </Stack>
                        </Box>

                        {/* Confidence */}
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TrendingUp fontSize="small" color="action" />
                          <Chip
                            label={`${getConfidenceLabel(statement.confidence)} (${statement.confidence ? Math.round(statement.confidence * 100) : 0}%)`}
                            color={getConfidenceColor(statement.confidence) as any}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>

                        {/* Source */}
                        {statement.source && (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Source fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {statement.source.title}
                              {statement.source.author && ` - ${statement.source.author}`}
                              {statement.source.year && ` (${statement.source.year})`}
                            </Typography>
                          </Stack>
                        )}

                        {/* Usage Statistics */}
                        <Stack direction="row" spacing={2}>
                          <Chip
                            label={`${statement.relationCount} Beziehungen`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          {statement.hasRelations && (
                            <Chip
                              label="Verwendet"
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          )}
                        </Stack>

                        {/* Created Date */}
                        <Typography variant="caption" color="text.secondary">
                          Erstellt: {formatDate(statement.created_at)}
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
            <DialogTitle>Neue Aussage erstellen</DialogTitle>
            <DialogContent>
              <StatementForm
                mode="create"
                onClose={() => setShowCreateDialog(false)}
                onResult={handleCreateStatement}
              />
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog 
            open={showEditDialog} 
            onClose={() => {
              setShowEditDialog(false);
              setSelectedStatement(null);
            }}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Aussage bearbeiten</DialogTitle>
            <DialogContent>
              {selectedStatement && (
                <StatementForm
                  mode="edit"
                  statementId={selectedStatement.id}
                  onClose={() => {
                    setShowEditDialog(false);
                    setSelectedStatement(null);
                  }}
                  onResult={handleEditStatement}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* Details Dialog */}
          <Dialog 
            open={showDetailsDialog} 
            onClose={() => {
              setShowDetailsDialog(false);
              setSelectedStatement(null);
            }}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Aussage Details</DialogTitle>
            <DialogContent>
              {selectedStatement && (
                <Stack spacing={3}>
                  {/* Content */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Inhalt:
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                      {selectedStatement.content}
                    </Typography>
                  </Box>

                  {/* Confidence */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Vertrauen:
                    </Typography>
                    <Chip
                      label={`${getConfidenceLabel(selectedStatement.confidence)} (${selectedStatement.confidence ? Math.round(selectedStatement.confidence * 100) : 0}%)`}
                      color={getConfidenceColor(selectedStatement.confidence) as any}
                      variant="outlined"
                    />
                  </Box>

                  {/* Source */}
                  {selectedStatement.source && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Quelle:
                      </Typography>
                      <Typography variant="body1">
                        {selectedStatement.source.title}
                        {selectedStatement.source.author && ` - ${selectedStatement.source.author}`}
                        {selectedStatement.source.year && ` (${selectedStatement.source.year})`}
                      </Typography>
                    </Box>
                  )}

                  {/* Relations */}
                  {selectedStatement.personEventRelations.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Verwendet in Beziehungen:
                      </Typography>
                      <List dense>
                        {selectedStatement.personEventRelations.map((relation) => (
                          <ListItem key={relation.id} divider>
                            <ListItemText
                              primary={`${relation.person.first_name || ''} ${relation.person.last_name || ''}`}
                              secondary={`${relation.relationship_type} - ${relation.event.title} (${relation.event.date ? new Date(relation.event.date).getFullYear() : 'Unbekannt'})`}
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
                      Erstellt: {formatDate(selectedStatement.created_at)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Aktualisiert: {formatDate(selectedStatement.updated_at)}
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
