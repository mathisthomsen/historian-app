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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Add,
  Search,
  Place,
  LocationOn,
  Edit,
  Delete,
  Visibility,
  Sort,
  FilterList,
  CalendarToday,
  Map,
  Public,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import SiteHeader from '../components/layout/SiteHeader';
import { api } from '@/app/lib';
import { ErrorBoundary } from '../components/layout/ErrorBoundary';
import RequireAuth from '../components/layout/RequireAuth';
import { useProject } from '@/app/contexts/ProjectContext';

interface Location {
  id: number;
  name: string;
  normalized?: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  geocoded_at?: string;
  created_at: string;
  updated_at: string;
  // Usage statistics
  eventCount?: number;
  birthPersonCount?: number;
  deathPersonCount?: number;
  totalUsage?: number;
}

export default function LocationsManagePage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [newLocation, setNewLocation] = useState({
    name: '',
    country: '',
    region: '',
    city: '',
    latitude: '',
    longitude: '',
  });
  
  const router = useRouter();
  const { selectedProject, isLoading: projectLoading } = useProject();

  const fetchLocations = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      
      if (search) {
        params.append('search', search);
      }
      
      if (filterCountry) {
        params.append('country', filterCountry);
      }

      if (sortField) {
        params.append('sortField', sortField);
        params.append('sortOrder', sortOrder);
      }

      const data = await api.get(`/api/locations?${params}`);
      setLocations(Array.isArray(data.locations) ? data.locations : []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false });
    } catch (error) {
      console.error('Error fetching locations:', error);
      setError('Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations(1);
  }, [search, filterCountry, sortField, sortOrder]);

  const handlePageChange = (_: any, value: number) => {
    fetchLocations(value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleSortChange = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleCreateLocation = async () => {
    if (!newLocation.name.trim()) {
      setError('Name ist erforderlich');
      return;
    }

    try {
      const locationData = {
        name: newLocation.name,
        country: newLocation.country || null,
        region: newLocation.region || null,
        city: newLocation.city || null,
        latitude: newLocation.latitude ? parseFloat(newLocation.latitude) : null,
        longitude: newLocation.longitude ? parseFloat(newLocation.longitude) : null,
      };

      await api.post('/api/locations', locationData);
      setShowCreateDialog(false);
      setNewLocation({
        name: '',
        country: '',
        region: '',
        city: '',
        latitude: '',
        longitude: '',
      });
      fetchLocations(1); // Refresh the list
    } catch (error) {
      console.error('Error creating location:', error);
      setError('Failed to create location');
    }
  };

  const handleEditLocation = async () => {
    if (!selectedLocation || !selectedLocation.name.trim()) {
      setError('Name ist erforderlich');
      return;
    }

    try {
      const locationData = {
        name: selectedLocation.name,
        country: selectedLocation.country || null,
        region: selectedLocation.region || null,
        city: selectedLocation.city || null,
        latitude: selectedLocation.latitude || null,
        longitude: selectedLocation.longitude || null,
      };

      await api.put(`/api/locations/${selectedLocation.id}`, locationData);
      setShowEditDialog(false);
      setSelectedLocation(null);
      fetchLocations(1); // Refresh the list
    } catch (error) {
      console.error('Error updating location:', error);
      setError('Failed to update location');
    }
  };

  const handleDeleteLocation = async (locationId: number) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Ort löschen möchten?')) {
      return;
    }

    try {
      await api.delete(`/api/locations/${locationId}`);
      fetchLocations(1); // Refresh the list
    } catch (error) {
      console.error('Error deleting location:', error);
      setError('Failed to delete location');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCountries = () => {
    const countries = new Set<string>();
    locations.forEach(location => {
      if (location.country) {
        countries.add(location.country);
      }
    });
    return Array.from(countries).sort();
  };

  if (loading || projectLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <SiteHeader title="Orte verwalten" showOverline={false} />
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

  return (
    <RequireAuth>
      <ErrorBoundary fallback={
        <Container maxWidth="lg" sx={{ mt: 6 }}>
          <SiteHeader title="Orte verwalten" showOverline={false} />
          <Alert severity="error" sx={{ my: 4 }}>
            Fehler beim Laden der Orte. Bitte versuchen Sie es später erneut.
            <Button color="inherit" size="small" onClick={() => window.location.reload()} sx={{ ml: 2 }}>
              Erneut versuchen
            </Button>
          </Alert>
        </Container>
      }>
        <Container maxWidth="lg" sx={{ mt: 6 }}>
          <SiteHeader title="Orte verwalten" showOverline={false} />
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
              <Button color="inherit" size="small" onClick={() => fetchLocations(1)} sx={{ ml: 2 }}>
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
                  placeholder="Orte durchsuchen..."
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
                  <InputLabel>Land</InputLabel>
                  <Select
                    value={filterCountry}
                    onChange={(e) => setFilterCountry(e.target.value)}
                    label="Land"
                  >
                    <MenuItem value="">Alle Länder</MenuItem>
                    {getCountries().map((country) => (
                      <MenuItem key={country} value={country}>
                        {country}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
                    <MenuItem value="name">Name</MenuItem>
                    <MenuItem value="country">Land</MenuItem>
                    <MenuItem value="created_at">Erstellt</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
              <Grid item xs={12} md={2}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowCreateDialog(true)}
                  fullWidth
                >
                  Neuer Ort
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {/* Locations Table */}
          {locations.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Place sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Keine Orte vorhanden
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Erstellen Sie Ihren ersten Ort, um mit der Verwaltung zu beginnen.
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setShowCreateDialog(true)}
              >
                Ersten Ort erstellen
              </Button>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Land</TableCell>
                    <TableCell>Region</TableCell>
                    <TableCell>Stadt</TableCell>
                    <TableCell>Koordinaten</TableCell>
                    <TableCell>Verwendung</TableCell>
                    <TableCell>Erstellt</TableCell>
                    <TableCell>Aktionen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {locations.map((location) => (
                    <TableRow key={location.id}>
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">
                          {location.name}
                        </Typography>
                        {location.normalized && location.normalized !== location.name && (
                          <Typography variant="body2" color="text.secondary">
                            Normalisiert: {location.normalized}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{location.country || '-'}</TableCell>
                      <TableCell>{location.region || '-'}</TableCell>
                      <TableCell>{location.city || '-'}</TableCell>
                      <TableCell>
                        {location.latitude && location.longitude ? (
                          <Typography variant="body2">
                            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                          </Typography>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          {location.eventCount && location.eventCount > 0 && (
                            <Chip label={`${location.eventCount} Events`} size="small" color="primary" variant="outlined" />
                          )}
                          {location.birthPersonCount && location.birthPersonCount > 0 && (
                            <Chip label={`${location.birthPersonCount} Geburten`} size="small" color="secondary" variant="outlined" />
                          )}
                          {location.deathPersonCount && location.deathPersonCount > 0 && (
                            <Chip label={`${location.deathPersonCount} Tode`} size="small" color="error" variant="outlined" />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(location.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Details anzeigen">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedLocation(location);
                                setShowDetailsDialog(true);
                              }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedLocation(location);
                              setShowEditDialog(true);
                            }}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteLocation(location.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
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
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Neuen Ort erstellen</DialogTitle>
            <DialogContent>
              <Stack spacing={3} sx={{ mt: 2 }}>
                <TextField
                  label="Name *"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
                  fullWidth
                  required
                />
                <TextField
                  label="Land"
                  value={newLocation.country}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, country: e.target.value }))}
                  fullWidth
                />
                <TextField
                  label="Region"
                  value={newLocation.region}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, region: e.target.value }))}
                  fullWidth
                />
                <TextField
                  label="Stadt"
                  value={newLocation.city}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, city: e.target.value }))}
                  fullWidth
                />
                <Grid container spacing={2}>
                  {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
                  <Grid item xs={6}>
                    <TextField
                      label="Breitengrad"
                      type="number"
                      value={newLocation.latitude}
                      onChange={(e) => setNewLocation(prev => ({ ...prev, latitude: e.target.value }))}
                      fullWidth
                      inputProps={{ step: "0.0001" }}
                    />
                  </Grid>
                  {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
                  <Grid item xs={6}>
                    <TextField
                      label="Längengrad"
                      type="number"
                      value={newLocation.longitude}
                      onChange={(e) => setNewLocation(prev => ({ ...prev, longitude: e.target.value }))}
                      fullWidth
                      inputProps={{ step: "0.0001" }}
                    />
                  </Grid>
                </Grid>
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowCreateDialog(false)}>
                Abbrechen
              </Button>
              <Button
                variant="contained"
                onClick={handleCreateLocation}
                disabled={!newLocation.name.trim()}
              >
                Erstellen
              </Button>
            </DialogActions>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog 
            open={showEditDialog} 
            onClose={() => {
              setShowEditDialog(false);
              setSelectedLocation(null);
            }}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Ort bearbeiten</DialogTitle>
            <DialogContent>
              {selectedLocation && (
                <Stack spacing={3} sx={{ mt: 2 }}>
                  <TextField
                    label="Name *"
                    value={selectedLocation.name}
                    onChange={(e) => setSelectedLocation(prev => prev ? { ...prev, name: e.target.value } : null)}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Land"
                    value={selectedLocation.country || ''}
                    onChange={(e) => setSelectedLocation(prev => prev ? { ...prev, country: e.target.value } : null)}
                    fullWidth
                  />
                  <TextField
                    label="Region"
                    value={selectedLocation.region || ''}
                    onChange={(e) => setSelectedLocation(prev => prev ? { ...prev, region: e.target.value } : null)}
                    fullWidth
                  />
                  <TextField
                    label="Stadt"
                    value={selectedLocation.city || ''}
                    onChange={(e) => setSelectedLocation(prev => prev ? { ...prev, city: e.target.value } : null)}
                    fullWidth
                  />
                  <Grid container spacing={2}>
                    {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
                    <Grid item xs={6}>
                      <TextField
                        label="Breitengrad"
                        type="number"
                        value={selectedLocation.latitude || ''}
                        onChange={(e) => setSelectedLocation(prev => prev ? { ...prev, latitude: Number.isFinite(parseFloat(e.target.value)) ? parseFloat(e.target.value) : undefined } : null)}
                        fullWidth
                        inputProps={{ step: "0.0001" }}
                      />
                    </Grid>
                    {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
                    <Grid item xs={6}>
                      <TextField
                        label="Längengrad"
                        type="number"
                        value={selectedLocation.longitude || ''}
                        onChange={(e) => setSelectedLocation(prev => prev ? { ...prev, longitude: Number.isFinite(parseFloat(e.target.value)) ? parseFloat(e.target.value) : undefined } : null)}
                        fullWidth
                        inputProps={{ step: "0.0001" }}
                      />
                    </Grid>
                  </Grid>
                </Stack>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setShowEditDialog(false);
                setSelectedLocation(null);
              }}>
                Abbrechen
              </Button>
              <Button
                variant="contained"
                onClick={handleEditLocation}
                disabled={!selectedLocation?.name.trim()}
              >
                Speichern
              </Button>
            </DialogActions>
          </Dialog>

          {/* Details Dialog */}
          <Dialog 
            open={showDetailsDialog} 
            onClose={() => {
              setShowDetailsDialog(false);
              setSelectedLocation(null);
            }}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>Ort Details</DialogTitle>
            <DialogContent>
              {selectedLocation && (
                <Stack spacing={3}>
                  {/* Basic Information */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Grundinformationen:
                    </Typography>
                    <Typography variant="h6">
                      {selectedLocation.name}
                    </Typography>
                    {selectedLocation.normalized && selectedLocation.normalized !== selectedLocation.name && (
                      <Typography variant="body2" color="text.secondary">
                        Normalisiert: {selectedLocation.normalized}
                      </Typography>
                    )}
                  </Box>

                  {/* Geographic Information */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Geografische Informationen:
                    </Typography>
                    <Grid container spacing={2}>
                      {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Land:</strong> {selectedLocation.country || 'Unbekannt'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Region:</strong> {selectedLocation.region || 'Unbekannt'}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Stadt:</strong> {selectedLocation.city || 'Unbekannt'}
                        </Typography>
                      </Grid>
                      {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
                      <Grid item xs={6}>
                        {selectedLocation.latitude && selectedLocation.longitude ? (
                          <>
                            <Typography variant="body2">
                              <strong>Breitengrad:</strong> {selectedLocation.latitude.toFixed(6)}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Längengrad:</strong> {selectedLocation.longitude.toFixed(6)}
                            </Typography>
                            {selectedLocation.geocoded_at && (
                              <Typography variant="body2" color="text.secondary">
                                Geocodiert: {formatDate(selectedLocation.geocoded_at)}
                              </Typography>
                            )}
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Keine Koordinaten verfügbar
                          </Typography>
                        )}
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Usage Statistics */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Verwendungsstatistiken:
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      {selectedLocation.eventCount && selectedLocation.eventCount > 0 && (
                        <Chip label={`${selectedLocation.eventCount} Events`} color="primary" variant="outlined" />
                      )}
                      {selectedLocation.birthPersonCount && selectedLocation.birthPersonCount > 0 && (
                        <Chip label={`${selectedLocation.birthPersonCount} Geburten`} color="secondary" variant="outlined" />
                      )}
                      {selectedLocation.deathPersonCount && selectedLocation.deathPersonCount > 0 && (
                        <Chip label={`${selectedLocation.deathPersonCount} Tode`} color="error" variant="outlined" />
                      )}
                      {selectedLocation.totalUsage && (
                        <Chip label={`${selectedLocation.totalUsage} Gesamt`} color="success" variant="outlined" />
                      )}
                    </Stack>
                  </Box>

                  {/* Metadata */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Metadaten:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Erstellt: {formatDate(selectedLocation.created_at)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Aktualisiert: {formatDate(selectedLocation.updated_at)}
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
