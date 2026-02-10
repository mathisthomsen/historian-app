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
} from '@mui/material';
import {
  Add,
  Search,
  Book,
  Link,
  Person,
  CalendarToday,
  TrendingUp,
  Edit,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import SiteHeader from '../components/layout/SiteHeader';
import { api } from '../lib';
import { ErrorBoundary } from '../components/layout/ErrorBoundary';
import RequireAuth from '../components/layout/RequireAuth';
import { useProject } from '../contexts/ProjectContext';
import SourceForm from '../components/forms/SourceForm';

interface Source {
  id: number;
  title: string;
  url?: string;
  author?: string;
  publication?: string;
  year?: number;
  reliability?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  statementCount: number;
  relationCount: number;
  totalUsage: number;
}

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  
  const router = useRouter();
  const { selectedProject, isLoading: projectLoading } = useProject();

  const fetchSources = async (page = 1) => {
    if (!selectedProject) {
      setSources([]);
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

      const data = await api.get(`/api/sources?${params}`);
      setSources(Array.isArray(data.sources) ? data.sources : []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
    } catch (error) {
      console.error('Error fetching sources:', error);
      setError('Failed to fetch sources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProject && !projectLoading) {
      fetchSources(1);
    }
  }, [selectedProject, projectLoading, search, sortField, sortOrder]);

  const handlePageChange = (_: any, value: number) => {
    fetchSources(value);
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

  const handleCreateSource = (result: { success: boolean; message: string; source?: any }) => {
    if (result.success) {
      setShowCreateDialog(false);
      fetchSources(1); // Refresh the list
    }
  };

  const handleEditSource = (result: { success: boolean; message: string; source?: any }) => {
    if (result.success) {
      setShowEditDialog(false);
      setSelectedSource(null);
      fetchSources(1); // Refresh the list
    }
  };

  const handleDeleteSource = async (sourceId: number) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Quelle löschen möchten?')) {
      return;
    }

    try {
      await api.delete(`/api/sources/${sourceId}`);
      fetchSources(1); // Refresh the list
    } catch (error) {
      console.error('Error deleting source:', error);
      setError('Failed to delete source');
    }
  };

  const getReliabilityColor = (reliability?: number) => {
    if (!reliability) return 'default';
    if (reliability >= 0.8) return 'success';
    if (reliability >= 0.6) return 'warning';
    return 'error';
  };

  const getReliabilityLabel = (reliability?: number) => {
    if (!reliability) return 'Unbekannt';
    if (reliability >= 0.8) return 'Hoch';
    if (reliability >= 0.6) return 'Mittel';
    return 'Niedrig';
  };

  if (loading || projectLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <SiteHeader title="Quellen" showOverline={false} />
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
        <SiteHeader title="Quellen" showOverline={false} />
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Kein Projekt ausgewählt
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Bitte wählen Sie ein Projekt aus, um Quellen anzuzeigen, oder erstellen Sie ein neues Projekt.
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
          <SiteHeader title="Quellen" showOverline={false} />
          <Alert severity="error" sx={{ my: 4 }}>
            Fehler beim Laden der Quellen. Bitte versuchen Sie es später erneut.
            <Button color="inherit" size="small" onClick={() => window.location.reload()} sx={{ ml: 2 }}>
              Erneut versuchen
            </Button>
          </Alert>
        </Container>
      }>
        <Container maxWidth="lg" sx={{ mt: 6 }}>
          <SiteHeader title="Quellen" showOverline={false} />
          
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
              <Button color="inherit" size="small" onClick={() => fetchSources(1)} sx={{ ml: 2 }}>
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
                  placeholder="Quellen durchsuchen..."
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
                <FormControl fullWidth>
                  <InputLabel>Sortieren nach</InputLabel>
                  <Select
                    value={sortField}
                    onChange={(e) => handleSortChange(e.target.value)}
                    label="Sortieren nach"
                  >
                    <MenuItem value="created_at">Erstellt</MenuItem>
                    <MenuItem value="title">Titel</MenuItem>
                    <MenuItem value="year">Jahr</MenuItem>
                    <MenuItem value="reliability">Zuverlässigkeit</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
              <Grid item xs={12} md={2}>
                <Button
                  variant="outlined"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  fullWidth
                >
                  {sortOrder === 'asc' ? '↑ Aufsteigend' : '↓ Absteigend'}
                </Button>
              </Grid>
              {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
              <Grid item xs={12} md={3}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowCreateDialog(true)}
                  fullWidth
                >
                  Neue Quelle
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Sources Grid */}
          {sources.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Book sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Keine Quellen vorhanden
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Erstellen Sie Ihre erste Quelle, um mit der Forschung zu beginnen.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setShowCreateDialog(true)}
              >
                Erste Quelle erstellen
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {sources.map((source) => (
                // @ts-expect-error MUI Grid type workaround for Next.js 15
                <Grid item xs={12} md={6} key={source.id}>
                  <Card>
                    <CardContent>
                      <Stack spacing={2}>
                        {/* Header */}
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Typography variant="h6" component="h3" sx={{ flex: 1 }}>
                            {source.title}
                          </Typography>
                          <Stack direction="row" spacing={1}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedSource(source);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteSource(source.id)}
                            >
                              <Delete />
                            </IconButton>
                          </Stack>
                        </Box>

                        {/* Author */}
                        {source.author && (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Person fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {source.author}
                            </Typography>
                          </Stack>
                        )}

                        {/* Publication */}
                        {source.publication && (
                          <Typography variant="body2" color="text.secondary">
                            {source.publication}
                          </Typography>
                        )}

                        {/* Year */}
                        {source.year && (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <CalendarToday fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {source.year}
                            </Typography>
                          </Stack>
                        )}

                        {/* URL */}
                        {source.url && (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Link fontSize="small" color="action" />
                            <Typography 
                              variant="body2" 
                              color="primary" 
                              sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                              onClick={() => window.open(source.url, '_blank')}
                            >
                              Link öffnen
                            </Typography>
                          </Stack>
                        )}

                        {/* Reliability */}
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TrendingUp fontSize="small" color="action" />
                          <Chip
                            label={`${getReliabilityLabel(source.reliability)} (${source.reliability ? Math.round(source.reliability * 100) : 0}%)`}
                            color={getReliabilityColor(source.reliability) as any}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>

                        {/* Usage Statistics */}
                        <Stack direction="row" spacing={2}>
                          <Chip
                            label={`${source.statementCount} Aussagen`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Chip
                            label={`${source.relationCount} Beziehungen`}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                          <Chip
                            label={`${source.totalUsage} Gesamt`}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        </Stack>

                        {/* Notes */}
                        {source.notes && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            "{source.notes}"
                          </Typography>
                        )}
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
            <DialogTitle>Neue Quelle erstellen</DialogTitle>
            <DialogContent>
              <SourceForm
                mode="create"
                onClose={() => setShowCreateDialog(false)}
                onResult={handleCreateSource}
              />
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog 
            open={showEditDialog} 
            onClose={() => {
              setShowEditDialog(false);
              setSelectedSource(null);
            }}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Quelle bearbeiten</DialogTitle>
            <DialogContent>
              {selectedSource && (
                <SourceForm
                  mode="edit"
                  sourceId={selectedSource.id}
                  onClose={() => {
                    setShowEditDialog(false);
                    setSelectedSource(null);
                  }}
                  onResult={handleEditSource}
                />
              )}
            </DialogContent>
          </Dialog>
        </Container>
      </ErrorBoundary>
    </RequireAuth>
  );
} 