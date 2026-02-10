'use client';

import { Box, Typography, Paper, Chip, Stack, Grid, Card, CardContent } from '@mui/material';
import { LocationOn, Map, Event, Person } from '@mui/icons-material';

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

interface SimpleLocationMapProps {
  locations: Location[];
  height?: string | number;
  onLocationClick?: (location: string) => void;
}

export default function SimpleLocationMap({ locations, height = 400, onLocationClick }: SimpleLocationMapProps) {
  const locationsWithCoords = locations.filter(loc => loc.latitude && loc.longitude);
  const locationsWithoutCoords = locations.filter(loc => !loc.latitude || !loc.longitude);

  return (
    <Box sx={{ height, width: '100%', overflow: 'auto' }}>
      <Paper 
        variant="outlined" 
        sx={{ 
          height: '100%', 
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Map color="primary" />
          <Typography variant="h6">Locations Overview</Typography>
          <Chip 
            label={`${locations.length} total`}
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>

        {locations.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <LocationOn sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No locations available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add locations to see them displayed here
            </Typography>
          </Box>
        ) : (
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {locationsWithCoords.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn color="success" fontSize="small" />
                  Geocoded Locations ({locationsWithCoords.length})
                </Typography>
                <Grid container spacing={2}>
                  {locationsWithCoords.map((location, index) => (
                    // @ts-expect-error MUI Grid type workaround for Next.js 15
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { 
                            bgcolor: 'action.hover',
                            transform: 'translateY(-2px)',
                            transition: 'all 0.2s ease-in-out'
                          }
                        }}
                        onClick={() => onLocationClick?.(location.location)}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <LocationOn color="success" fontSize="small" />
                            <Typography variant="body2" fontWeight="medium" noWrap>
                              {location.location}
                            </Typography>
                          </Box>
                          
                          <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
                            <Chip 
                              label={`${location.eventCount} Events`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              icon={<Event fontSize="small" />}
                            />
                            <Chip 
                              label={`${location.lifeEventCount} Life Events`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                              icon={<Person fontSize="small" />}
                            />
                          </Stack>
                          
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            📍 {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}
                          </Typography>
                          
                          {(location.city || location.region || location.country) && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                              {[location.city, location.region, location.country].filter(Boolean).join(', ')}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {locationsWithoutCoords.length > 0 && (
              <Box>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn color="warning" fontSize="small" />
                  Locations Without Coordinates ({locationsWithoutCoords.length})
                </Typography>
                <Grid container spacing={2}>
                  {locationsWithoutCoords.map((location, index) => (
                    // @ts-expect-error MUI Grid type workaround for Next.js 15
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { 
                            bgcolor: 'action.hover',
                            transform: 'translateY(-2px)',
                            transition: 'all 0.2s ease-in-out'
                          }
                        }}
                        onClick={() => onLocationClick?.(location.location)}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <LocationOn color="warning" fontSize="small" />
                            <Typography variant="body2" fontWeight="medium" noWrap>
                              {location.location}
                            </Typography>
                          </Box>
                          
                          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                            <Chip 
                              label={`${location.eventCount} Events`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              icon={<Event fontSize="small" />}
                            />
                            <Chip 
                              label={`${location.lifeEventCount} Life Events`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                              icon={<Person fontSize="small" />}
                            />
                          </Stack>
                          
                          <Chip 
                            label="No Coordinates"
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
} 