'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  CardActions
} from '@mui/material'
import {
  Person as PersonIcon,
  Event as EventIcon,
  LocationOn as LocationIcon,
  Book as BookIcon,
  Timeline as TimelineIcon,
  Analytics as AnalyticsIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  Map as MapIcon,
  LibraryBooks as LibraryIcon
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { api } from '../lib/api'
import DashboardSkeleton from '../components/DashboardSkeleton'
import { useAuth } from '@workos-inc/authkit-nextjs/components'
import RequireAuth from '../components/RequireAuth'

interface DashboardStats {
  totalPersons: number
  totalEvents: number
  totalLifeEvents: number
  totalLocations: number
  totalLiterature: number
  recentActivity: number
  researchProjects: number
}

interface RecentActivity {
  id: number
  type: 'person' | 'event' | 'location' | 'literature'
  action: 'created' | 'updated' | 'imported'
  title: string
  timestamp: string
}

export default function DashboardPage() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalPersons: 0,
    totalEvents: 0,
    totalLifeEvents: 0,
    totalLocations: 0,
    totalLiterature: 0,
    recentActivity: 0,
    researchProjects: 0
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])

  useEffect(() => {
    // Fetch dashboard data
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch stats from API using the authenticated API utility
      const statsData = await api.get('/api/dashboard/stats')
      setStats(statsData)

      // Fetch recent activities
      const activitiesData = await api.get('/api/dashboard/recent-activities')
      setRecentActivities(activitiesData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'person': return <PersonIcon />
      case 'event': return <EventIcon />
      case 'location': return <LocationIcon />
      case 'literature': return <BookIcon />
      default: return <TimelineIcon />
    }
  }

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'created': return 'success'
      case 'updated': return 'info'
      case 'imported': return 'warning'
      default: return 'default'
    }
  }

  const QuickActionCard = ({ title, description, icon, color, onClick }: any) => (
    <Card 
      sx={{ 
        height: '100%', 
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8]
        }
      }}
      onClick={onClick}
    >
      <CardContent sx={{ textAlign: 'center', p: 3 }}>
        <Avatar 
          sx={{ 
            width: 56, 
            height: 56, 
            mx: 'auto', 
            mb: 2,
            bgcolor: `${color}.main`
          }}
        >
          {icon}
        </Avatar>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  )

  const StatCard = ({ title, value, icon, color, actionTitle, actionTarget, secActionTitle, secActionTarget }: any) => (
    <Card sx={{ height: '100%', boxShadow: 2, bgcolor: 'secondary.main', borderRadius: 2, color: 'secondary.contrastText', padding: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
            {icon && React.cloneElement(icon, { sx: { fontSize: 56, color: 'secondary.light' } })}
          <Box>
            <Typography variant="h4" component="div">
              {value.toLocaleString()}
            </Typography>
            <Typography variant="body2">
              {title}
            </Typography>
          </Box>
        </Box>

      </CardContent>
      <CardActions>
        <Button variant="contained" color="primary" onClick={() => router.push(actionTarget)}>
          {actionTitle}
        </Button>
        <Button 
          variant="outlined" 
          sx={{ 
            color: 'white',
            borderColor: 'white',
            '&:hover': {
              borderColor: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
          onClick={() => router.push(secActionTarget)}
        >
          <AddIcon /> {secActionTitle}
        </Button>
      </CardActions>
    </Card>
  )

  return (
    <RequireAuth>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
        <Container maxWidth="xl">
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
                Historian Dashboard
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Search">
                  <IconButton>
                    <SearchIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Notifications">
                  <IconButton>
                    <NotificationsIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Settings">
                  <IconButton>
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Profile">
                  <IconButton>
                    <AccountIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Typography variant="h6" color="text.secondary">
              Manage your historical research data and insights
            </Typography>
          </Box>

          {/* Stats Overview */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Historical Persons"
                value={stats.totalPersons}
                icon={<PersonIcon />}
                actionTitle="View Persons"
                actionTarget="/persons"
                secActionTitle="Add Person"
                secActionTarget="/persons/create"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Historical Events"
                value={stats.totalEvents}
                icon={<EventIcon />}
                actionTitle="View Events"
                actionTarget="/events"
                secActionTitle="Add Event"
                secActionTarget="/events/create"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Locations"
                value={stats.totalLocations}
                icon={<LocationIcon />}
                actionTitle="View Locations"
                actionTarget="/locations"
                secActionTitle="Add Location"
                secActionTarget="/locations/create"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Literature Sources"
                value={stats.totalLiterature}
                icon={<BookIcon />}
                actionTitle="View Literature"
                actionTarget="/literature"
                secActionTitle="Add Literature"
                secActionTarget="/literature/create"
              />
            </Grid>
          </Grid>

       

          

          {/* Research Tools */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              Research Tools
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <TimelineIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">Timeline Analysis</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Visualize historical events across time periods
                    </Typography>
                    <Button variant="outlined" size="small" onClick={() => router.push('/timeline')}>
                      Explore Timeline
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <MapIcon sx={{ mr: 1, color: 'success.main' }} />
                      <Typography variant="h6">Geographic Analysis</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Map historical events and movements
                    </Typography>
                    <Button variant="outlined" size="small" onClick={() => router.push('/maps')}>
                      View Maps
                    </Button>
                  </CardContent>
                </Card>
              </Grid> 
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <LibraryIcon sx={{ mr: 1, color: 'warning.main' }} />
                      <Typography variant="h6">Source Management</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Organize and cite your research sources
                    </Typography>
                    <Button variant="outlined" size="small" onClick={() => router.push('/sources')}>
                      Manage Sources
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <TrendingUpIcon sx={{ mr: 1, color: 'error.main' }} />
                      <Typography variant="h6">Data Analytics</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Analyze patterns and trends in your data
                    </Typography>
                    <Button variant="outlined" size="small" onClick={() => router.push('/analytics')}>
                      View Analytics
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Box>
    </RequireAuth>
  )
} 