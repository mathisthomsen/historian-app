'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Stack,
  Skeleton,
  Alert,
  Divider,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Person,
  Event,
  Timeline,
  Add,
  Edit,
  Delete,
  AccessTime,
  TrendingUp,
} from '@mui/icons-material';
import SiteHeader from '../components/SiteHeader';

interface Activity {
  id: number;
  type: 'create' | 'update' | 'delete';
  entity: 'person' | 'event' | 'life_event';
  title: string;
  description: string;
  timestamp: string;
  user?: string;
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityData();
  }, []);

  const fetchActivityData = async () => {
    setLoading(true);
    try {
      // Mock data for now - in a real app, you'd have a dedicated activity endpoint
      const mockActivities: Activity[] = [
        {
          id: 1,
          type: 'create',
          entity: 'person',
          title: 'Neue Person hinzugefügt',
          description: 'Max Mustermann wurde zur Datenbank hinzugefügt',
          timestamp: '2024-01-15T10:30:00Z',
          user: 'admin@example.com'
        },
        {
          id: 2,
          type: 'create',
          entity: 'event',
          title: 'Historisches Ereignis erstellt',
          description: 'Gründung der Republik wurde als historisches Ereignis erstellt',
          timestamp: '2024-01-14T14:20:00Z',
          user: 'admin@example.com'
        },
        {
          id: 3,
          type: 'create',
          entity: 'life_event',
          title: 'Lebensereignis hinzugefügt',
          description: 'Geburt von Max Mustermann wurde hinzugefügt',
          timestamp: '2024-01-13T09:15:00Z',
          user: 'admin@example.com'
        },
        {
          id: 4,
          type: 'update',
          entity: 'person',
          title: 'Person aktualisiert',
          description: 'Daten von Max Mustermann wurden bearbeitet',
          timestamp: '2024-01-12T16:45:00Z',
          user: 'admin@example.com'
        },
        {
          id: 5,
          type: 'delete',
          entity: 'life_event',
          title: 'Lebensereignis gelöscht',
          description: 'Ein Lebensereignis wurde entfernt',
          timestamp: '2024-01-11T11:30:00Z',
          user: 'admin@example.com'
        },
      ];

      setActivities(mockActivities);
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (entity: string) => {
    switch (entity) {
      case 'person':
        return <Person />;
      case 'event':
        return <Event />;
      case 'life_event':
        return <Timeline />;
      default:
        return <Event />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'create':
        return 'success';
      case 'update':
        return 'primary';
      case 'delete':
        return 'error';
      default:
        return 'default';
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'create':
        return 'Erstellt';
      case 'update':
        return 'Aktualisiert';
      case 'delete':
        return 'Gelöscht';
      default:
        return type;
    }
  };

  const getEntityLabel = (entity: string) => {
    switch (entity) {
      case 'person':
        return 'Person';
      case 'event':
        return 'Ereignis';
      case 'life_event':
        return 'Lebensereignis';
      default:
        return entity;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 6 }}>
        <SiteHeader title="Aktivitäten" showOverline={false} />
        <Paper sx={{ p: 3 }}>
          {[...Array(5)].map((_, i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={24} />
                  <Skeleton variant="text" width="40%" height={20} />
                </Box>
              </Stack>
            </Box>
          ))}
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 6 }}>
      <SiteHeader title="Aktivitäten" showOverline={false} />
      
      {/* Activity Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Heute
                  </Typography>
                  <Typography variant="h4" component="div">
                    {activities.filter(a => new Date(a.timestamp).toDateString() === new Date().toDateString()).length}
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: 'primary.main' }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Diese Woche
                  </Typography>
                  <Typography variant="h4" component="div">
                    {activities.filter(a => {
                      const activityDate = new Date(a.timestamp);
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return activityDate >= weekAgo;
                    }).length}
                  </Typography>
                </Box>
                <AccessTime sx={{ fontSize: 40, color: 'secondary.main' }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Gesamt
                  </Typography>
                  <Typography variant="h4" component="div">
                    {activities.length}
                  </Typography>
                </Box>
                <Add sx={{ fontSize: 40, color: 'success.main' }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Activity List */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Letzte Aktivitäten
        </Typography>
        
        {activities.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              Noch keine Aktivitäten vorhanden
            </Typography>
          </Box>
        ) : (
          <List>
            {activities.map((activity, index) => (
              <Box key={activity.id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: `${getActivityColor(activity.type)}.main` }}>
                      {getActivityIcon(activity.entity)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body1" component="span">
                          {activity.title}
                        </Typography>
                        <Chip 
                          label={getActivityLabel(activity.type)}
                          size="small"
                          color={getActivityColor(activity.type) as any}
                          variant="outlined"
                        />
                        <Chip 
                          label={getEntityLabel(activity.entity)}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                    }
                    secondary={
                      <Stack spacing={1} sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {activity.description}
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <AccessTime fontSize="small" color="action" />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(activity.timestamp).toLocaleString('de-DE')}
                            </Typography>
                          </Stack>
                          {activity.user && (
                            <Typography variant="caption" color="text.secondary">
                              von {activity.user}
                            </Typography>
                          )}
                        </Stack>
                      </Stack>
                    }
                  />
                </ListItem>
                {index < activities.length - 1 && <Divider variant="inset" component="li" />}
              </Box>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
} 