'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Container,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  People,
  Event,
  LocationOn,
  Book,
  TrendingUp,
  Timeline,
} from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <Card sx={{ height: '100%', borderRadius: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              color: `${color}.main`,
              borderRadius: 2,
              p: 1,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: `${color}.main` }}>
          {value.toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
}

interface DashboardStats {
  totalPersons: number;
  totalEvents: number;
  totalLocations: number;
  totalLiterature: number;
  recentActivities: any[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const [statsResponse, activitiesResponse] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/recent-activities'),
        ]);

        if (!statsResponse.ok || !activitiesResponse.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const statsData = await statsResponse.json();
        const activitiesData = await activitiesResponse.json();

        setStats({
          totalPersons: statsData.totalPersons || 0,
          totalEvents: statsData.totalEvents || 0,
          totalLocations: statsData.totalLocations || 0,
          totalLiterature: statsData.totalLiterature || 0,
          recentActivities: activitiesData.activities || [],
        });
      } catch (error) {
        console.error('Dashboard error:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!session) {
    return null; // Will redirect to login
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
          Welcome back, {session.user?.name}!
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {stats && (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Persons"
                  value={stats.totalPersons}
                  icon={<People />}
                  color="primary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Events"
                  value={stats.totalEvents}
                  icon={<Event />}
                  color="secondary"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Locations"
                  value={stats.totalLocations}
                  icon={<LocationOn />}
                  color="info"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard
                  title="Total Literature"
                  value={stats.totalLiterature}
                  icon={<Book />}
                  color="success"
                />
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                      Recent Activities
                    </Typography>
                    {stats.recentActivities.length > 0 ? (
                      <Box>
                        {stats.recentActivities.map((activity, index) => (
                          <Box
                            key={index}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              py: 1,
                              borderBottom: index < stats.recentActivities.length - 1 ? 1 : 0,
                              borderColor: 'divider',
                            }}
                          >
                            <Timeline sx={{ mr: 2, color: 'primary.main' }} />
                            <Box>
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {activity.action}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {new Date(activity.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No recent activities
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
                      Quick Actions
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        • Add new person
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • Create event
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • Add location
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        • Import data
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </>
        )}
      </Container>
    </Box>
  );
} 