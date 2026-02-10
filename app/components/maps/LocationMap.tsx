'use client';

import { useEffect, useRef, useState } from 'react';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { 
    ssr: false,
    loading: () => <div>Loading map...</div>,
  }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { 
    ssr: false,
  }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { 
    ssr: false,
  }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { 
    ssr: false,
  }
);

interface Location {
  location: string;
  eventCount: number;
  lifeEventCount: number;
  totalCount: number;
  lastUsed: string | null;
  latitude?: number | null;
  longitude?: number | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
}

interface LocationMapProps {
  locations: Location[];
  height?: string | number;
  onLocationClick?: (location: string) => void;
  onError?: () => void;
}

export default function LocationMap({ locations, height = 400, onLocationClick, onError }: LocationMapProps) {
  const [geocodedLocations, setGeocodedLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef<any>(null);

  // Load Leaflet CSS only on client side
  useEffect(() => {
    // Load Leaflet CSS dynamically
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css';
    link.integrity = 'sha512-xodZBNTC5n17Xt2atTPuE1HxjVMSvLVW9ocqUKLsCC5CXdbqCmblAshOMAS6/keqq/sMZMZ19scR4PsZChSR7A==';
    link.crossOrigin = '';
    document.head.appendChild(link);
    
    // Fix for default markers in react-leaflet
    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
      setMapLoaded(true);
    }).catch((error) => {
      console.error('Failed to load Leaflet:', error);
      setError('Failed to load map');
      onError?.();
    });
  }, [onError]);

  // Geocode locations that don't have coordinates
  useEffect(() => {
    const geocodeLocations = async () => {
      const locationsToGeocode = locations.filter(loc => !loc.latitude || !loc.longitude);
      
      if (locationsToGeocode.length === 0) {
        setGeocodedLocations(locations);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const geocodedResults = await Promise.all(
          locationsToGeocode.map(async (location) => {
            try {
              const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location.location)}&format=json&limit=1`);
              const data = await response.json();
              
              if (data && data.length > 0) {
                return {
                  ...location,
                  latitude: parseFloat(data[0].lat),
                  longitude: parseFloat(data[0].lon)
                };
              }
              return location;
            } catch (error) {
              console.warn(`Failed to geocode ${location.location}:`, error);
              return location;
            }
          })
        );

        // Combine geocoded results with locations that already had coordinates
        const locationsWithCoords = locations.filter(loc => loc.latitude && loc.longitude);
        setGeocodedLocations([...locationsWithCoords, ...geocodedResults]);
      } catch (error) {
        setError('Failed to geocode some locations');
        setGeocodedLocations(locations);
      } finally {
        setLoading(false);
      }
    };

    if (mapLoaded) {
      geocodeLocations();
    }
  }, [locations, mapLoaded]);

  // Calculate map bounds
  const getMapBounds = () => {
    const locationsWithCoords = geocodedLocations.filter(loc => loc.latitude && loc.longitude);
    
    if (locationsWithCoords.length === 0) {
      return { lat: 51.505, lng: -0.09 }; // Default to London
    }

    const lats = locationsWithCoords.map(loc => loc.latitude!);
    const lngs = locationsWithCoords.map(loc => loc.longitude!);
    
    return {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lng: (Math.min(...lngs) + Math.max(...lngs)) / 2
    };
  };

  const bounds = getMapBounds();
  const locationsWithCoords = geocodedLocations.filter(loc => loc.latitude && loc.longitude);

  if (!mapLoaded) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading map...</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Geocoding locations...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert severity="warning">{error}</Alert>
      </Box>
    );
  }

  if (locationsWithCoords.length === 0) {
    return (
      <Box sx={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="text.secondary">
          No locations with coordinates available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height, width: '100%', position: 'relative' }}>
      <MapContainer
        center={[bounds.lat, bounds.lng]}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {locationsWithCoords.map((location, index) => (
          <Marker
            key={index}
            position={[location.latitude!, location.longitude!]}
            eventHandlers={{
              click: () => {
                if (onLocationClick) {
                  onLocationClick(location.location);
                }
              }
            }}
          >
            <Popup>
              <div>
                <h3>{location.location}</h3>
                <p>Events: {location.eventCount}</p>
                <p>Life Events: {location.lifeEventCount}</p>
                <p>Total: {location.totalCount}</p>
                {location.lastUsed && (
                  <p>Last used: {new Date(location.lastUsed).toLocaleDateString()}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
} 