'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
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
  CircularProgress
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
import { useSession, signOut } from 'next-auth/react';
import React, { useRef } from 'react';
import * as MuiIcons from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Tooltip from '@mui/material/Tooltip';
import Link from 'next/link';
import { AppBarNavigation } from './components/AppBarNavigation';
import { mainNavLoggedOut } from './components/navConfig';
import { DrawerNavigation } from './components/DrawerNavigation';

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
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [publicNavItems, setPublicNavItems] = useState([]);
  const [navOpenStates, setNavOpenStates] = useState({});
  const [menuAnchors, setMenuAnchors] = useState({}); // For public nav menus
  const theme = useMemo(() => {
    if (darkMode === 'dark' || darkMode === 'light') {
      return createCustomTheme(darkMode);
    }
    return createCustomTheme('light');
  }, [darkMode]);
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const [publicDrawerOpen, setPublicDrawerOpen] = useState(false);

  // NextAuth session
  const { data: session, status } = useSession();
  const isAuthenticated = !!session?.user;
  const user = session?.user;

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
  // const publicNavItems = [
  //   { path: '/', label: 'Home', icon: <HomeIcon />, index: 0 },
  //   { path: '/api/auth/login', label: 'Login', icon: <LoginIcon />, index: 1 },
  // ];

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
    await signOut({ callbackUrl: '/' });
  };

  useEffect(() => {
    setMounted(true);
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

  // Don't render until mounted to prevent hydration mismatches
  if (!mounted) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

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
            background: 'rgba(30, 41, 59, 0.55)', // semi-transparent dark
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            boxShadow: '0 4px 32px 0 rgba(0,0,0,0.10)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            color: '#fff',
          }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              {isAuthenticated && (
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
              )}
              {!isAuthenticated && !isMdUp && (
                <IconButton
                  edge="start"
                  color="inherit"
                  onClick={() => setPublicDrawerOpen((prev) => !prev)}
                  aria-label="Menü öffnen"
                  aria-controls="public-navigation-drawer"
                >
                  <MenuIcon />
                </IconButton>
              )}
              <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <Image src="/logo1.svg" alt="Evidoxa App" width={56} height={56} />
                <Typography variant="h6" component="p" sx={{ flexGrow: 1, fontWeight: 400, color: '#fff', letterSpacing: -1 }}>
                  Evidoxa
                </Typography>
              </Link>
              {/* Public navigation in AppBar (md+) */}
              {!isAuthenticated && isMdUp && <AppBarNavigation items={mainNavLoggedOut} />}
            </Stack>
            
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
                    {user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : <AccountCircleIcon />)}
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
                  PaperProps={{
                    sx: {
                      background: 'rgba(30, 41, 59, 0.55)',
                      backdropFilter: 'blur(18px)',
                      WebkitBackdropFilter: 'blur(18px)',
                      boxShadow: '0 4px 32px 0 rgba(0,0,0,0.10)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#fff',
                    }
                  }}
                >
                  <MenuItem onClick={handleUserMenuClose} disabled>
                    <ListItemIcon>
                      <AccountCircleIcon fontSize="small" />
                    </ListItemIcon>
                    {user.name || user.email}
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
              isMdUp ? (
                <Stack direction="row" spacing={2}>
                  <Button color="inherit" onClick={() => router.push('/auth/register')}>
                    Registrieren
                  </Button>
                  <Button color="inherit" onClick={() => router.push('/auth/login')}>
                    Login
                  </Button>
                </Stack>
              ) : (
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Registrieren">
                    <IconButton color="inherit" aria-label="Registrieren" onClick={() => router.push('/auth/register')}>
                      <PersonAddIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Login">
                    <IconButton color="inherit" aria-label="Login" onClick={() => router.push('/auth/login')}>
                      <LoginIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              )
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
            mt: { xs: '56px', md: '64px' },
          },
        }}
        PaperProps={{
          sx: {
            background: 'rgba(30, 41, 59, 0.55)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            boxShadow: '0 4px 32px 0 rgba(0,0,0,0.10)',
            borderRight: '1px solid rgba(255,255,255,0.08)',
            color: '#fff',
          }
        }}
      >
        <List id="logged-in-navigation-drawer-content">
          {isAuthenticated
            ? currentNavItems.map((item) => (
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
              ))
            : null}
        </List>
      </Drawer>
      {/* Drawer for public nav on mobile */}
      {!isAuthenticated && !isMdUp && (
        <Drawer
          id="public-navigation-drawer"
          anchor="left"
          open={publicDrawerOpen}
          onClose={() => setPublicDrawerOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            width: 240,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 240,
              boxSizing: 'border-box',
              mt: { xs: '56px', md: '64px' },
            },
          }}
          PaperProps={{
            sx: {
              background: 'rgba(30, 41, 59, 0.55)',
              backdropFilter: 'blur(18px)',
              WebkitBackdropFilter: 'blur(18px)',
              boxShadow: '0 4px 32px 0 rgba(0,0,0,0.10)',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              color: '#fff',
            }
          }}
        >
          <DrawerNavigation id="public-navigation-drawer-content" items={mainNavLoggedOut} />
        </Drawer>
      )}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
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