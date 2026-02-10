'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Divider,
} from '@mui/material';
import { LocationOn, Search, CheckCircle, Warning } from '@mui/icons-material';
import { geocodingService } from '../../lib/services/geocoding';

interface LocationOption {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    country?: string;
    state?: string;
    city?: string;
    town?: string;
    village?: string;
  };
  importance: number;
}

interface LocationValidationModalProps {
  open: boolean;
  onClose: () => void;
  onLocationSelect: (location: {
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    region?: string;
    city?: string;
  }) => void;
  initialLocation?: string;
}

export default function LocationValidationModal({
  open,
  onClose,
  onLocationSelect,
  initialLocation = ''
}: LocationValidationModalProps) {
  const [searchTerm, setSearchTerm] = useState(initialLocation);
  const [searchResults, setSearchResults] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null);

  // Search for locations when search term changes
  useEffect(() => {
    const searchLocations = async () => {
      if (!searchTerm.trim() || searchTerm.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const results = await geocodingService.searchLocations(searchTerm);
        setSearchResults(results);
      } catch (error) {
        console.error('Location search failed:', error);
        setError('Failed to search for locations. Please try again.');
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(searchLocations, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleLocationSelect = (location: LocationOption) => {
    setSelectedLocation(location);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect({
        name: selectedLocation.display_name,
        latitude: parseFloat(selectedLocation.lat),
        longitude: parseFloat(selectedLocation.lon),
        country: selectedLocation.address.country,
        region: selectedLocation.address.state,
        city: selectedLocation.address.city || selectedLocation.address.town || selectedLocation.address.village
      });
      onClose();
    }
  };

  const handleUseAsIs = () => {
    if (searchTerm.trim()) {
      onLocationSelect({
        name: searchTerm.trim(),
        latitude: 0,
        longitude: 0
      });
      onClose();
    }
  };

  const formatLocationAddress = (location: LocationOption) => {
    const parts = [];
    if (location.address.city || location.address.town || location.address.village) {
      parts.push(location.address.city || location.address.town || location.address.village);
    }
    if (location.address.state) {
      parts.push(location.address.state);
    }
    if (location.address.country) {
      parts.push(location.address.country);
    }
    return parts.join(', ');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationOn color="primary" />
          <Typography variant="h6">Validate Location</Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Enter a location name to find matching places. Select the correct location or use your original text.
            </Typography>
            
            <TextField
              fullWidth
              label="Location"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g., Vienna, Austria"
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Box>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
              <Typography sx={{ ml: 2 }}>Searching for locations...</Typography>
            </Box>
          )}

          {searchResults.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Found {searchResults.length} location(s):
              </Typography>
              
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {searchResults.map((location, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemButton
                      selected={selectedLocation?.display_name === location.display_name}
                      onClick={() => handleLocationSelect(location)}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {location.display_name.split(',')[0]}
                            </Typography>
                            <Chip 
                              label={`${(location.importance * 100).toFixed(0)}%`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              {formatLocationAddress(location)}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              📍 {parseFloat(location.lat).toFixed(4)}, {parseFloat(location.lon).toFixed(4)}
                            </Typography>
                          </Box>
                        }
                      />
                      {selectedLocation?.display_name === location.display_name && (
                        <CheckCircle color="primary" />
                      )}
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {searchTerm.trim() && searchResults.length === 0 && !loading && (
            <Alert severity="info">
              No locations found for "{searchTerm}". You can use the original text or try a different search term.
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {searchTerm.trim() && (
          <Button 
            onClick={handleUseAsIs}
            startIcon={<Warning />}
            variant="outlined"
          >
            Use as entered
          </Button>
        )}
        <Button 
          onClick={handleConfirm}
          variant="contained"
          disabled={!selectedLocation}
          startIcon={<CheckCircle />}
        >
          Use Selected Location
        </Button>
      </DialogActions>
    </Dialog>
  );
} 