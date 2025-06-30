'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Switch, 
  FormControlLabel,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Link
} from '@mui/material';
import { 
  Add as AddIcon, 
  Sync as SyncIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  AccountCircle as AccountCircleIcon
} from '@mui/icons-material';
import { api } from '../lib/api';

interface SyncConfig {
  id: number;
  service: string;
  name: string;
  isActive: boolean;
  collectionName?: string;
  lastSyncAt?: string;
  autoSync: boolean;
  syncInterval?: number;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
}

interface SyncResult {
  success: boolean;
  imported: number;
  updated: number;
  errors: string[];
  message?: string;
}

export default function BibliographySyncPage() {
  const [configs, setConfigs] = useState<SyncConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SyncConfig | null>(null);
  const [formData, setFormData] = useState({
    service: 'zotero',
    name: '',
    apiKey: '',
    apiSecret: '',
    accessToken: '',
    refreshToken: '',
    collectionId: '',
    collectionName: '',
    autoSync: false,
    syncInterval: 60
  });
  const [syncResults, setSyncResults] = useState<{ [key: number]: SyncResult }>({});
  const [testing, setTesting] = useState<{ [key: number]: boolean }>({});
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [oauthSuccess, setOauthSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadConfigs();
    // Check for OAuth success/error messages in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const success = urlParams.get('success');
    
    if (error) {
      setOauthError(getErrorMessage(error));
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (success) {
      setOauthSuccess(getSuccessMessage(success));
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'oauth_failed':
        return 'OAuth authentication failed. Please try again.';
      case 'invalid_state':
        return 'Invalid OAuth state. Please try again.';
      case 'no_code':
        return 'No authorization code received. Please try again.';
      case 'token_exchange_failed':
        return 'Failed to exchange authorization code for tokens. Please try again.';
      case 'callback_failed':
        return 'OAuth callback processing failed. Please try again.';
      default:
        return 'An error occurred during OAuth authentication.';
    }
  };

  const getSuccessMessage = (success: string): string => {
    switch (success) {
      case 'oauth_completed':
        return 'Mendeley OAuth authentication completed successfully!';
      default:
        return 'Operation completed successfully.';
    }
  };

  const loadConfigs = async () => {
    try {
      const response = await api.get('/api/bibliography-sync');
      setConfigs(response.data || []);
    } catch (error) {
      console.error('Failed to load sync configs:', error);
      setConfigs([]); // Ensure configs is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleMendeleyOAuth = async () => {
    setOauthLoading(true);
    setOauthError(null);
    
    try {
      const response = await api.get('/api/auth/mendeley');
      const { authUrl } = response;
      
      // Redirect to Mendeley OAuth
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to initiate Mendeley OAuth:', error);
      setOauthError('Failed to initiate OAuth authentication. Please try again.');
    } finally {
      setOauthLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingConfig) {
        await api.put(`/api/bibliography-sync/${editingConfig.id}`, formData);
      } else {
        await api.post('/api/bibliography-sync', formData);
      }
      
      setDialogOpen(false);
      setEditingConfig(null);
      resetForm();
      loadConfigs();
    } catch (error) {
      console.error('Failed to save sync config:', error);
    }
  };

  const handleEdit = (config: SyncConfig) => {
    setEditingConfig(config);
    setFormData({
      service: config.service,
      name: config.name,
      apiKey: '',
      apiSecret: '',
      accessToken: '',
      refreshToken: '',
      collectionId: '',
      collectionName: config.collectionName || '',
      autoSync: config.autoSync,
      syncInterval: config.syncInterval || 60
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this sync configuration?')) {
      try {
        await api.delete(`/api/bibliography-sync/${id}`);
        loadConfigs();
      } catch (error) {
        console.error('Failed to delete sync config:', error);
      }
    }
  };

  const handleTestConnection = async (config: SyncConfig) => {
    setTesting(prev => ({ ...prev, [config.id]: true }));
    
    try {
      const response = await api.post(`/api/bibliography-sync/${config.id}/test`);
      const result = response.data;
      
      if (result.success) {
        setSyncResults(prev => ({
          ...prev,
          [config.id]: { success: true, imported: 0, updated: 0, errors: [], message: 'Connection successful' }
        }));
      } else {
        setSyncResults(prev => ({
          ...prev,
          [config.id]: { success: false, imported: 0, updated: 0, errors: [result.error || 'Connection failed'] }
        }));
      }
    } catch (error) {
      setSyncResults(prev => ({
        ...prev,
        [config.id]: { success: false, imported: 0, updated: 0, errors: ['Connection test failed'] }
      }));
    } finally {
      setTesting(prev => ({ ...prev, [config.id]: false }));
    }
  };

  const handleSync = async (config: SyncConfig) => {
    try {
      const response = await api.post(`/api/bibliography-sync/${config.id}/sync`);
      setSyncResults(prev => ({
        ...prev,
        [config.id]: response.data
      }));
      loadConfigs(); // Refresh to get updated lastSyncAt
    } catch (error) {
      console.error('Failed to sync:', error);
      setSyncResults(prev => ({
        ...prev,
        [config.id]: { success: false, imported: 0, updated: 0, errors: ['Sync failed'] }
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      service: 'zotero',
      name: '',
      apiKey: '',
      apiSecret: '',
      accessToken: '',
      refreshToken: '',
      collectionId: '',
      collectionName: '',
      autoSync: false,
      syncInterval: 60
    });
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'zotero':
        return '📚';
      case 'mendeley':
        return '🔬';
      case 'citavi':
        return '📖';
      default:
        return '📄';
    }
  };

  const isOAuthService = (service: string) => {
    return service === 'mendeley';
  };

  const hasValidTokens = (config: SyncConfig) => {
    return config.accessToken && config.refreshToken && config.tokenExpiresAt;
  };

  const isTokenExpired = (config: SyncConfig) => {
    if (!config.tokenExpiresAt) return true;
    return new Date(config.tokenExpiresAt) <= new Date();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Bibliography Synchronization
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Add Sync Configuration
        </Button>
      </Box>

      {/* OAuth Status Alerts */}
      {oauthError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setOauthError(null)}>
          {oauthError}
        </Alert>
      )}
      
      {oauthSuccess && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setOauthSuccess(null)}>
          {oauthSuccess}
        </Alert>
      )}

      {(configs || []).length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No sync configurations yet
            </Typography>
            <Typography variant="body2" color="textSecondary" mb={2}>
              Connect your bibliography management tools to automatically import literature
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
            >
              Add your first sync configuration
            </Button>
          </CardContent>
        </Card>
      ) : (
        <List>
          {(configs || []).map((config) => (
            <React.Fragment key={config.id}>
              <ListItem>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <span>{getServiceIcon(config.service)}</span>
                      <Typography variant="h6">{config.name}</Typography>
                      <Chip 
                        label={config.service} 
                        size="small" 
                        variant="outlined" 
                      />
                      {config.isActive ? (
                        <Chip 
                          label="Active" 
                          size="small" 
                          color="success" 
                          icon={<CheckCircleIcon />}
                        />
                      ) : (
                        <Chip 
                          label="Inactive" 
                          size="small" 
                          color="default"
                        />
                      )}
                      {isOAuthService(config.service) && (
                        <>
                          {hasValidTokens(config) ? (
                            isTokenExpired(config) ? (
                              <Chip 
                                label="Token Expired" 
                                size="small" 
                                color="warning"
                                icon={<ErrorIcon />}
                              />
                            ) : (
                              <Chip 
                                label="OAuth Connected" 
                                size="small" 
                                color="success"
                                icon={<AccountCircleIcon />}
                              />
                            )
                          ) : (
                            <Chip 
                              label="OAuth Required" 
                              size="small" 
                              color="error"
                              icon={<ErrorIcon />}
                            />
                          )}
                        </>
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        {config.collectionName && `Collection: ${config.collectionName}`}
                        {config.lastSyncAt && ` • Last sync: ${new Date(config.lastSyncAt).toLocaleString()}`}
                        {config.autoSync && ` • Auto-sync: ${config.syncInterval}min`}
                      </Typography>
                      {syncResults[config.id] && (
                        <Alert 
                          severity={syncResults[config.id].success ? 'success' : 'error'}
                          sx={{ mt: 1 }}
                        >
                          {syncResults[config.id].message || 
                           `${syncResults[config.id].imported} items imported, ${syncResults[config.id].errors.length} errors`}
                        </Alert>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box display="flex" gap={1}>
                    {isOAuthService(config.service) && !hasValidTokens(config) && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={oauthLoading ? <CircularProgress size={16} /> : <AccountCircleIcon />}
                        onClick={handleMendeleyOAuth}
                        disabled={oauthLoading}
                        color="primary"
                      >
                        {oauthLoading ? 'Auth...' : 'Authenticate'}
                      </Button>
                    )}
                    <Button
                      size="small"
                      startIcon={testing[config.id] ? <CircularProgress size={16} /> : <CheckCircleIcon />}
                      onClick={() => handleTestConnection(config)}
                      disabled={testing[config.id]}
                    >
                      Test
                    </Button>
                    <Button
                      size="small"
                      startIcon={<SyncIcon />}
                      onClick={() => handleSync(config)}
                    >
                      Sync
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(config)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(config.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingConfig ? 'Edit Sync Configuration' : 'Add Sync Configuration'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Box display="flex" flexDirection="column" gap={2}>
              <FormControl fullWidth>
                <InputLabel>Service</InputLabel>
                <Select
                  value={formData.service}
                  onChange={(e) => setFormData(prev => ({ ...prev, service: e.target.value }))}
                  label="Service"
                >
                  <MenuItem value="zotero">Zotero</MenuItem>
                  <MenuItem value="mendeley">Mendeley</MenuItem>
                  <MenuItem value="citavi">Citavi</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Configuration Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />

              {formData.service === 'zotero' && (
                <>
                  <TextField
                    fullWidth
                    label="API Key"
                    value={formData.apiKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                    required
                    helperText="Get your API key from Zotero Settings > Feeds/API"
                  />
                  <TextField
                    fullWidth
                    label="Collection ID (optional)"
                    value={formData.collectionId}
                    onChange={(e) => setFormData(prev => ({ ...prev, collectionId: e.target.value }))}
                    helperText="Leave empty to sync all items"
                  />
                </>
              )}

              {formData.service === 'mendeley' && (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Mendeley uses OAuth authentication. Click the button below to authenticate with your Mendeley account.
                    </Typography>
                  </Alert>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={oauthLoading ? <CircularProgress size={20} /> : <AccountCircleIcon />}
                    onClick={handleMendeleyOAuth}
                    disabled={oauthLoading}
                    sx={{ mb: 2 }}
                  >
                    {oauthLoading ? 'Authenticating...' : 'Authenticate with Mendeley'}
                  </Button>
                  <Typography variant="caption" color="textSecondary">
                    After authentication, your access tokens will be securely stored and automatically refreshed.
                  </Typography>
                </Box>
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.autoSync}
                    onChange={(e) => setFormData(prev => ({ ...prev, autoSync: e.target.checked }))}
                  />
                }
                label="Enable automatic synchronization"
              />

              {formData.autoSync && (
                <TextField
                  fullWidth
                  type="number"
                  label="Sync Interval (minutes)"
                  value={formData.syncInterval}
                  onChange={(e) => setFormData(prev => ({ ...prev, syncInterval: parseInt(e.target.value) }))}
                  inputProps={{ min: 15, max: 1440 }}
                  helperText="Minimum 15 minutes, maximum 24 hours"
                />
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingConfig ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
} 