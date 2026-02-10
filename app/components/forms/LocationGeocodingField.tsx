'use client';

import { useState, useEffect } from 'react';
import { TextField, Autocomplete, Chip, Box, Typography, CircularProgress } from '@mui/material';
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
}

interface LocationGeocodingFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onLocationSelect?: (location: { name: string; latitude: number; longitude: number; country?: string; region?: string; city?: string }) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function LocationGeocodingField({
  label,
  value,
  onChange,
  onLocationSelect,
  placeholder = "Ort eingeben...",
  disabled = false
}: LocationGeocodingFieldProps) {
  const [options, setOptions] = useState<LocationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = async (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);

    if (newValue.length < 3) {
      setOptions([]);
      return;
    }

    setLoading(true);
    try {
      const results = await geocodingService.searchLocations(newValue);
      setOptions(results.slice(0, 5)); // Limit to 5 results
    } catch (error) {
      console.error('Geocoding error:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (selectedLocation: LocationOption | null) => {
    if (selectedLocation && onLocationSelect) {
      const locationData = {
        name: selectedLocation.display_name,
        latitude: parseFloat(selectedLocation.lat),
        longitude: parseFloat(selectedLocation.lon),
        country: selectedLocation.address.country,
        region: selectedLocation.address.state,
        city: selectedLocation.address.city || selectedLocation.address.town || selectedLocation.address.village
      };
      onLocationSelect(locationData);
    }
  };

  return (
    <Box>
      <Autocomplete
        freeSolo
        options={options}
        value={inputValue}
        inputValue={inputValue}
        onInputChange={(_, newInputValue) => handleInputChange(newInputValue)}
        onChange={(_, newValue) => {
          if (typeof newValue === 'string') {
            handleInputChange(newValue);
          } else if (newValue) {
            handleLocationSelect(newValue);
          }
        }}
        getOptionLabel={(option) => {
          if (typeof option === 'string') return option;
          return option.display_name;
        }}
        getOptionKey={(option) => {
          if (typeof option === 'string') return option;
          // Create unique key using lat/lon to avoid duplicates
          return `${option.lat}-${option.lon}-${option.display_name}`;
        }}
        renderOption={(props, option) => {
          // Extract key from props to avoid React warning
          const { key, ...otherProps } = props;
          return (
            <Box component="li" key={key} {...otherProps}>
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  {option.display_name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.address.country && `${option.address.country}`}
                  {option.address.state && `, ${option.address.state}`}
                  {option.address.city && `, ${option.address.city}`}
                </Typography>
              </Box>
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            disabled={disabled}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        loading={loading}
        noOptionsText="Keine Orte gefunden"
        loadingText="Suche Orte..."
      />
      
      {value && (
        <Box sx={{ mt: 1 }}>
          <Chip
            label={`Koordinaten werden gesucht für: ${value}`}
            size="small"
            color="info"
            variant="outlined"
          />
        </Box>
      )}
    </Box>
  );
}
