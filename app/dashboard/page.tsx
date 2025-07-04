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
  Tooltip
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

  const StatCard = ({ title, value, icon, color, subtitle }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: `${color}.main`, mr: 2 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="h4" component="div">
              {value.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
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
            {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Historical Persons"
                value={stats.totalPersons}
                icon={<PersonIcon />}
                color="primary"
                subtitle="Individuals in your database"
              />
            </Grid>
            {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Historical Events"
                value={stats.totalEvents}
                icon={<EventIcon />}
                color="secondary"
                subtitle="Events documented"
              />
            </Grid>
            {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Locations"
                value={stats.totalLocations}
                icon={<LocationIcon />}
                color="success"
                subtitle="Places mapped"
              />
            </Grid>
            {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Literature Sources"
                value={stats.totalLiterature}
                icon={<BookIcon />}
                color="warning"
                subtitle="References catalogued"
              />
            </Grid>
          </Grid>

          <Grid container spacing={4}>
            {/* Quick Actions */}
            {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
            <Grid item xs={12} md={8}>
              <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={3}>
                {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
                <Grid item xs={12} sm={6} md={4}>
                  <QuickActionCard
                    title="Add Person"
                    description="Document a historical figure"
                    icon={<PersonIcon />}
                    color="primary"
                    onClick={() => router.push('/persons/create')}
                  />
                </Grid>
                {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
                <Grid item xs={12} sm={6} md={4}>
                  <QuickActionCard
                    title="Record Event"
                    description="Log a historical event"
                    icon={<EventIcon />}
                    color="secondary"
                    onClick={() => router.push('/events/create')}
                  />
                </Grid>
                {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
                <Grid item xs={12} sm={6} md={4}>
                  <QuickActionCard
                    title="Add Location"
                    description="Map a historical place"
                    icon={<LocationIcon />}
                    color="success"
                    onClick={() => router.push('/locations/create')}
                  />
                </Grid>
                {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
                <Grid item xs={12} sm={6} md={4}>
                  <QuickActionCard
                    title="Catalog Literature"
                    description="Add source material"
                    icon={<BookIcon />}
                    color="warning"
                    onClick={() => router.push('/literature/create')}
                  />
                </Grid>
                {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
                <Grid item xs={12} sm={6} md={4}>
                  <QuickActionCard
                    title="Import Data"
                    description="Bulk import from files"
                    icon={<UploadIcon />}
                    color="info"
                    onClick={() => router.push('/import')}
                  />
                </Grid>
                {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
                <Grid item xs={12} sm={6} md={4}>
                  <QuickActionCard
                    title="Analytics"
                    description="View research insights"
                    icon={<AnalyticsIcon />}
                    color="error"
                    onClick={() => router.push('/analytics')}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Recent Activity */}
            {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, height: 'fit-content' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Recent Activity
                  </Typography>
                  <Button size="small" onClick={() => router.push('/activity')}>
                    View All
                  </Button>
                </Box>
                <List sx={{ p: 0 }}>
                  {recentActivities.slice(0, 5).map((activity, index) => (
                    <React.Fragment key={activity.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          {getActivityIcon(activity.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={activity.title}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip 
                                label={activity.action} 
                                size="small" 
                                color={getActivityColor(activity.action) as any}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {new Date(activity.timestamp).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < recentActivities.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>

          {/* Research Tools */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              Research Tools
            </Typography>
            <Grid container spacing={3}>
              {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
              <Grid item xs={12} sm={6} md={3}>
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
              {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
              <Grid item xs={12} sm={6} md={3}>
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
              {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
              <Grid item xs={12} sm={6} md={3}>
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
              {/* @ts-expect-error MUI Grid type workaround for Next.js 15 */}
              <Grid item xs={12} sm={6} md={3}>
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