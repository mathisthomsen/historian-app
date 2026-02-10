'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Box,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';

interface ImportRecord {
  id: string;
  import_type: string;
  batch_id: string;
  file_name: string;
  total_records: number;
  imported_count: number;
  error_count: number;
  skipped_count: number;
  processing_time: number;
  status: string;
  error_details?: any;
  created_at: string;
}

interface ImportStats {
  totalImports: number;
  totalRecords: number;
  totalImported: number;
  totalErrors: number;
  totalSkipped: number;
  averageProcessingTime: number;
}

interface ImportHistoryProps {
  type?: 'persons' | 'events';
}

export default function ImportHistory({ type }: ImportHistoryProps) {
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImport, setSelectedImport] = useState<ImportRecord | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchImportHistory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      
      const response = await fetch(`/api/import/history?${params}`);
      const result = await response.json();

      if (result.success) {
        setImports(result.data.imports);
        setStats(result.data.stats);
      } else {
        setError(result.error || 'Failed to fetch import history');
      }
    } catch (error) {
      setError('Failed to fetch import history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImportHistory();
  }, [type]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'partial': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon />;
      case 'failed': return <ErrorIcon />;
      case 'partial': return <WarningIcon />;
      default: return <InfoIcon />;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE');
  };

  const handleViewDetails = (importRecord: ImportRecord) => {
    setSelectedImport(importRecord);
    setDetailsOpen(true);
  };

  const handleReRunImport = async (importRecord: ImportRecord) => {
    // This would trigger a re-import with the same file
    // Implementation depends on your requirements
    console.log('Re-run import:', importRecord);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <CircularProgress size={20} />
            <Typography>Lade Import-Historie...</Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        <Typography>{error}</Typography>
        <Button onClick={fetchImportHistory} sx={{ mt: 1 }}>
          Erneut versuchen
        </Button>
      </Alert>
    );
  }

  return (
    <Stack spacing={3}>
      {/* Statistics */}
      {stats && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Import-Statistiken
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Chip label={`${stats.totalImports} Imports`} color="primary" />
              <Chip label={`${stats.totalRecords} Datensätze`} color="info" />
              <Chip label={`${stats.totalImported} Importiert`} color="success" />
              <Chip label={`${stats.totalErrors} Fehler`} color="error" />
              <Chip label={`${stats.totalSkipped} Übersprungen`} color="warning" />
              <Chip label={`Ø ${formatDuration(stats.averageProcessingTime)}`} color="default" />
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Import History Table */}
      <Card>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">
              Import-Historie
            </Typography>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchImportHistory}
              size="small"
            >
              Aktualisieren
            </Button>
          </Stack>

          {imports.length === 0 ? (
            <Alert severity="info">
              <Typography>Keine Import-Historie verfügbar</Typography>
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Status</TableCell>
                    <TableCell>Typ</TableCell>
                    <TableCell>Datei</TableCell>
                    <TableCell>Datensätze</TableCell>
                    <TableCell>Importiert</TableCell>
                    <TableCell>Fehler</TableCell>
                    <TableCell>Zeit</TableCell>
                    <TableCell>Datum</TableCell>
                    <TableCell>Aktionen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {imports.map((importRecord) => (
                    <TableRow key={importRecord.id}>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(importRecord.status)}
                          label={importRecord.status}
                          color={getStatusColor(importRecord.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={importRecord.import_type === 'persons' ? 'Personen' : 'Events'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                          {importRecord.file_name}
                        </Typography>
                      </TableCell>
                      <TableCell>{importRecord.total_records}</TableCell>
                      <TableCell>
                        <Chip
                          label={importRecord.imported_count}
                          color="success"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {importRecord.error_count > 0 ? (
                          <Chip
                            label={importRecord.error_count}
                            color="error"
                            size="small"
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDuration(importRecord.processing_time)}
                      </TableCell>
                      <TableCell>
                        {formatDate(importRecord.created_at)}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Details anzeigen">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(importRecord)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          {importRecord.status === 'failed' && (
                            <Tooltip title="Erneut versuchen">
                              <IconButton
                                size="small"
                                onClick={() => handleReRunImport(importRecord)}
                              >
                                <RefreshIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Import Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <HistoryIcon />
            <Typography variant="h6">
              Import-Details
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {selectedImport && (
            <Stack spacing={2}>
              <Typography variant="subtitle1">Datei: {selectedImport.file_name}</Typography>
              <Typography variant="subtitle1">Batch ID: {selectedImport.batch_id}</Typography>
              <Typography variant="subtitle1">Typ: {selectedImport.import_type}</Typography>
              
              <Stack direction="row" spacing={2}>
                <Chip label={`${selectedImport.total_records} Gesamt`} />
                <Chip label={`${selectedImport.imported_count} Importiert`} color="success" />
                <Chip label={`${selectedImport.error_count} Fehler`} color="error" />
                <Chip label={`${selectedImport.skipped_count} Übersprungen`} color="warning" />
              </Stack>

              <Typography variant="subtitle2">Verarbeitungszeit: {formatDuration(selectedImport.processing_time)}</Typography>
              <Typography variant="subtitle2">Status: {selectedImport.status}</Typography>

              {selectedImport.error_details && (
                <Alert severity="error">
                  <Typography variant="body2">
                    Fehler-Details: {JSON.stringify(selectedImport.error_details, null, 2)}
                  </Typography>
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>
            Schließen
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
} 