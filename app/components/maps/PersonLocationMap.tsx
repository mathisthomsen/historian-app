'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Typography, Alert, Button } from '@mui/material';
import L from 'leaflet';

interface PersonLocationMapProps {
  personEvents: Array<{
    id: number;
    event: {
      id: number;
      title: string;
      date?: string;
      location?: string;
      latitude?: number;
      longitude?: number;
      country?: string;
      region?: string;
      city?: string;
    };
    relationship_type: string;
  }>;
  person: {
    birth_location_ref?: {
      id: number;
      name: string;
      country?: string;
      region?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
    };
    death_location_ref?: {
      id: number;
      name: string;
      country?: string;
      region?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
    };
  };
}

// Create custom icons using SVG
const createCustomIcon = (color: string, type: 'birth' | 'death' | 'event') => {
  const svgIcon = `
    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
      ${type === 'birth' ? '<text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">B</text>' : ''}
      ${type === 'death' ? '<text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">D</text>' : ''}
      ${type === 'event' ? '<text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">E</text>' : ''}
    </svg>
  `;

  return L.divIcon({
    className: 'custom-div-icon',
    html: svgIcon,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

export default function PersonLocationMap({ personEvents, person }: PersonLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      console.log('PersonLocationMap: Initializing map with data:', { personEvents, person });

      // Initialize map
      const map = L.map(mapRef.current).setView([51.505, -0.09], 2);
      mapInstanceRef.current = map;

      console.log('Map initialized:', map);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      console.log('Tile layer added');

      // Collect all locations with coordinates
      const locations: Array<{
        lat: number;
        lng: number;
        title: string;
        type: 'birth' | 'death' | 'event';
        description: string;
      }> = [];

      // Debug: Log the person data structure
      console.log('Person birth_location_ref:', person.birth_location_ref);
      console.log('Person death_location_ref:', person.death_location_ref);
      console.log('PersonEvents:', personEvents);

      // Add birth location
      if (person.birth_location_ref?.latitude && person.birth_location_ref?.longitude) {
        console.log('Adding birth location:', person.birth_location_ref);
        locations.push({
          lat: person.birth_location_ref.latitude,
          lng: person.birth_location_ref.longitude,
          title: `Geburtsort: ${person.birth_location_ref.name}`,
          type: 'birth',
          description: `${person.birth_location_ref.name}${person.birth_location_ref.country ? `, ${person.birth_location_ref.country}` : ''}`
        });
      }

      // Add death location
      if (person.death_location_ref?.latitude && person.death_location_ref?.longitude) {
        console.log('Adding death location:', person.death_location_ref);
        locations.push({
          lat: person.death_location_ref.latitude,
          lng: person.death_location_ref.longitude,
          title: `Sterbeort: ${person.death_location_ref.name}`,
          type: 'death',
          description: `${person.death_location_ref.name}${person.death_location_ref.country ? `, ${person.death_location_ref.country}` : ''}`
        });
      }

      // Add event locations
      personEvents.forEach((relation) => {
        console.log('Checking event:', relation.event);
        if (relation.event.latitude && relation.event.longitude) {
          console.log('Adding event location:', relation.event);
          locations.push({
            lat: relation.event.latitude,
            lng: relation.event.longitude,
            title: relation.event.title,
            type: 'event',
            description: `${relation.event.title}${relation.event.date ? ` (${new Date(relation.event.date).getFullYear()})` : ''}${relation.event.location ? ` - ${relation.event.location}` : ''}`
          });
        }
      });

      console.log('Total locations found:', locations.length);

      // Add markers for each location
      locations.forEach((location) => {
        let iconColor = '#1976d2'; // Default blue for events
        if (location.type === 'birth') iconColor = '#4caf50'; // Green for birth
        if (location.type === 'death') iconColor = '#f44336'; // Red for death

        console.log('Adding marker for:', location.title, 'at', location.lat, location.lng);

        const marker = L.marker([location.lat, location.lng], {
          icon: createCustomIcon(iconColor, location.type)
        }).addTo(map);

        marker.bindPopup(`
          <div style="min-width: 200px;">
            <strong>${location.title}</strong><br/>
            <small style="color: #666;">${location.description}</small>
          </div>
        `);
      });

      if (locations.length > 0) {
        // Fit map to show all markers
        const group = L.featureGroup();
        locations.forEach((location) => {
          group.addLayer(L.marker([location.lat, location.lng]));
        });
        map.fitBounds(group.getBounds().pad(0.1));
      }

      console.log('Map setup complete');

    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError(error instanceof Error ? error.message : 'Unknown error');
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [personEvents, person]);

  if (mapError) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        Fehler beim Laden der Karte: {mapError}
      </Alert>
    );
  }

  // Check if we have any location data at all
  const hasLocationData = personEvents.some(e => e.event.location) || 
                         person.birth_location_ref || 
                         person.death_location_ref;

  if (!hasLocationData) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Keine Ortsdaten verfügbar
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Fügen Sie Orte zu Ereignissen oder Geburts-/Sterbeorten hinzu, um sie auf der Karte anzuzeigen.
        </Typography>
      </Box>
    );
  }

  // Check if we have coordinates
  const hasCoordinates = personEvents.some(e => e.event.latitude && e.event.longitude) ||
                        (person.birth_location_ref?.latitude && person.birth_location_ref?.longitude) ||
                        (person.death_location_ref?.latitude && person.death_location_ref?.longitude);

  if (!hasCoordinates) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Orte gefunden, aber keine Koordinaten verfügbar
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          Die folgenden Orte wurden gefunden, aber haben noch keine geografischen Koordinaten:
        </Typography>
        <Box sx={{ textAlign: 'left', maxWidth: 400, mx: 'auto' }}>
          {person.birth_location_ref && (
            <Typography variant="caption" color="text.secondary">
              • Geburtsort: {person.birth_location_ref.name}
            </Typography>
          )}
          {person.death_location_ref && (
            <Typography variant="caption" color="text.secondary">
              • Sterbeort: {person.death_location_ref.name}
            </Typography>
          )}
          {personEvents.filter(e => e.event.location).map((relation, index) => (
            <Typography key={index} variant="caption" color="text.secondary">
              • Ereignis: {relation.event.title} - {relation.event.location}
            </Typography>
          ))}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Bearbeiten Sie die Person oder Ereignisse, um automatisch Koordinaten zu erhalten.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        ref={mapRef}
        sx={{
          height: 400,
          width: '100%',
          borderRadius: 1,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      />
      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#4caf50' }} />
          <Typography variant="caption">Geburtsort</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f44336' }} />
          <Typography variant="caption">Sterbeort</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#1976d2' }} />
          <Typography variant="caption">Ereignisse</Typography>
        </Box>
      </Box>
    </Box>
  );
}
