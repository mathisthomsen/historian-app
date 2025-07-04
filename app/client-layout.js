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
  useScrollTrigger
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
import { logout } from './lib/api';
import { ErrorBoundary } from './components/ErrorBoundary';
import LoadingBar from './components/LoadingBar';
import { createCustomTheme } from './lib/theme';

// Hook to detect scroll direction
function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState('up');
  const [prevScrollY, setPrevScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > prevScrollY) {
        setScrollDirection('down');
      } else {
        setScrollDirection('up');
      }
      setPrevScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScrollY]);

  return scrollDirection;
}

export default function RootLayout({ children }) {
  const [darkMode, setDarkMode] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const scrollDirection = useScrollDirection();

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

  // Navigation items for public users
  const publicNavItems = [
    { path: '/', label: 'Home', icon: <HomeIcon />, index: 0 },
    { path: '/auth/login', label: 'Login', icon: <LoginIcon />, index: 1 },
    { path: '/auth/register', label: 'Register', icon: <PersonIcon />, index: 2 },
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

  const handleLogout = () => {
    logout(); // This will handle API call, cookie clearing, and redirect
  };

  // Check authentication status on mount and route changes
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/status', { credentials: 'include' });
        const data = await res.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
          setUser(data.user);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
      }
    };
    checkAuth();
  }, [pathname]);

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
    // fallback to system preference if darkMode is null
    if (typeof window !== 'undefined' && window.matchMedia) {
      return createCustomTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
    return createCustomTheme('light');
  }, [darkMode]);

  if (darkMode === null) return null; // gegen Hydration-Probleme

  const currentNavItems = isAuthenticated ? authenticatedNavItems : publicNavItems;
  const currentPath = pathname;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Slide appear={false} direction="down" in={scrollDirection === 'up'}>
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            transition: 'transform 0.3s ease-in-out',
            transform: scrollDirection === 'down' ? 'translateY(-100%)' : 'translateY(0)',
          }}
        >
          <Toolbar>
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
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Historian App
            </Typography>
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
                    {user.name ? user.name.charAt(0).toUpperCase() : <AccountCircleIcon />}
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
                  <MenuItem onClick={handleUserMenuClose}>
                    <ListItemIcon>
                      <AccountCircleIcon fontSize="small" />
                    </ListItemIcon>
                    Profile
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
              <Button color="inherit" onClick={() => router.push('/auth/login')}>
                Login
              </Button>
            )}
          </Toolbar>
        </AppBar>
      </Slide>
      
      {/* Loading Bar */}
      <LoadingBar />
      
      {/* Drawer */}
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
            mt: '64px', // Account for fixed AppBar
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

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: '64px', // Account for fixed AppBar
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
