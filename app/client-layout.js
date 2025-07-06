'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  ListSubheader,
  CssBaseline,
  Box,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Button,
  Slide,
  useScrollTrigger,
  Stack,
  Chip,
  Image
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AssessmentIcon from '@mui/icons-material/Assessment';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HomeIcon from '@mui/icons-material/Home';
import BookIcon from '@mui/icons-material/Book';
import TimelineIcon from '@mui/icons-material/Timeline';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import { ThemeProvider } from '@mui/material/styles';
import './globals.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import LoadingBar from './components/LoadingBar';
import { createCustomTheme } from './lib/theme';
import { useAuth } from '@workos-inc/authkit-nextjs/components';

// Hide the app bar when scrolling down and show it when scrolling up (like a sticky header)
// https://mui.com/material-ui/react-app-bar/#sticky-app-bar
// https://mui.com/material-ui/react-app-bar/#hide-on-scroll

function HideOnScroll(props) {
  const { children } = props;
  const trigger = useScrollTrigger();

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

export default function RootLayout({ children }) {
  const [darkMode, setDarkMode] = useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // AuthKit user/session
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;

  // Navigation items for authenticated users
  const authenticatedNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon />, index: 0 },
    { path: '/persons', label: 'Historical Persons', icon: <PersonIcon />, index: 1 },
    { path: '/events', label: 'Historical Events', icon: <EventIcon />, index: 2 },
    { path: '/locations', label: 'Locations', icon: <LocationOnIcon />, index: 3 },
    { path: '/literature', label: 'Literature', icon: <BookIcon />, index: 4 },
    { path: '/timeline', label: 'Timeline', icon: <TimelineIcon />, index: 5 },
    { path: '/analytics', label: 'Analytics', icon: <AssessmentIcon />, index: 6 },
  ];

  // Navigation items for public users (no register)
  const publicNavItems = [
    { path: '/', label: 'Home', icon: <HomeIcon />, index: 0 },
    { path: '/api/auth/login', label: 'Login', icon: <LoginIcon />, index: 1 },
  ];

  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };

  const handleNavigate = (path, index) => {
    setOpen(false); // Close drawer when navigating
    router.push(path);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = async () => {
    window.location.href = '/api/auth/logout';
  };

  useEffect(() => {
    const storedMode = localStorage.getItem('darkMode');
    if (storedMode === 'dark' || storedMode === 'light') {
      setDarkMode(storedMode);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark ? 'dark' : 'light');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = darkMode === 'dark' ? 'light' : 'dark';
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
  };

  const theme = useMemo(() => {
    if (darkMode === 'dark' || darkMode === 'light') {
      return createCustomTheme(darkMode);
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      return createCustomTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
    return createCustomTheme('light');
  }, [darkMode]);

  // Debug staging detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('Hostname:', window.location.hostname);
      console.log('Is Vercel app:', window.location.hostname.includes('vercel.app'));
      console.log('Contains git-:', window.location.hostname.includes('git-'));
      console.log('Is not your-app:', !window.location.hostname.includes('your-app'));
      console.log('Is not main domain:', window.location.hostname !== 'historian-app-phi.vercel.app');
    }
  }, []);

  if (darkMode === null || loading) return null;

  const currentNavItems = isAuthenticated ? authenticatedNavItems : publicNavItems;
  const currentPath = pathname;

  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HideOnScroll>
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            boxShadow: '8',
            background: `linear-gradient(170deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton 
                edge="start" 
                color="inherit" 
                onClick={toggleDrawer(!open)}
                aria-label="Menü öffnen"
                aria-expanded={open}
                aria-controls="navigation-drawer"
              >
                <MenuIcon />
              </IconButton>
            
              <img src="/logo1.svg" alt="Evidoxa App" height={56} />
              <Typography variant="h6" component="p" sx={{ flexGrow: 1, fontWeight: 400, color: '#fff', letterSpacing: -1 }}>
                Evidoxa
              </Typography>
            </Stack>
            {/* Staging indicator */}
            {process.env.NEXT_PUBLIC_IS_STAGING === 'true' && (
              <Chip
                label="STAGING"
                size="small"
                color="warning"
                sx={{
                  mr: 2,
                  fontWeight: 'bold',
                  backgroundColor: '#ff9800',
                  color: 'white',
                  '& .MuiChip-label': {
                    fontWeight: 'bold',
                  },
                }}
              />
            )}
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton color="inherit" onClick={toggleDarkMode}>
                {darkMode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
              {isAuthenticated && user ? (
              <>
                <IconButton
                  color="inherit"
                  onClick={handleUserMenuOpen}
                  sx={{ ml: 1 }}
                >
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {user.firstName ? user.firstName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : <AccountCircleIcon />)}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={userMenuAnchor}
                  open={Boolean(userMenuAnchor)}
                  onClose={handleUserMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <MenuItem onClick={handleUserMenuClose} disabled>
                    <ListItemIcon>
                      <AccountCircleIcon fontSize="small" />
                    </ListItemIcon>
                    {user.firstName || user.email}
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Stack direction="row" spacing={2}>
                <Button color="inherit" onClick={() => window.location.href = 'https://hopeful-bubble-54-staging.authkit.app/sign-up'}>
                  Registrieren
                </Button>
                <Button color="inherit" onClick={() => window.location.href = '/api/auth/login'}>
                  Login
                </Button>
              </Stack>
            )}
            </Stack>
           
          </Toolbar>
        </AppBar>
      </HideOnScroll>
      <LoadingBar />
      <Drawer
        anchor="left"
        open={open}
        onClose={toggleDrawer(false)}
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            mt: '64px',
          },
        }}
      >
        <List>
          {currentNavItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={currentPath === item.path}
                onClick={() => handleNavigate(item.path, item.index)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: currentPath === item.path ? 'inherit' : 'text.primary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: '64px',
          minHeight: '100vh',
        }}
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </Box>
    </ThemeProvider>
  );
}
