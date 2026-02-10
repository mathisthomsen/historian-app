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
  CircularProgress,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Skeleton
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/PersonOutlined';
import EventIcon from '@mui/icons-material/EventOutlined';
import LocationOnIcon from '@mui/icons-material/LocationOnOutlined';
import AssessmentIcon from '@mui/icons-material/AssessmentOutlined';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import HomeIcon from '@mui/icons-material/Home';
import BookIcon from '@mui/icons-material/BookOutlined';
import TimelineIcon from '@mui/icons-material/TimelineOutlined';
import AccountCircleIcon from '@mui/icons-material/AccountCircleOutlined';
import LogoutIcon from '@mui/icons-material/LogoutOutlined';
import LoginIcon from '@mui/icons-material/LoginOutlined';
import ProjectIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircleOutlined';
import { ThemeProvider } from '@mui/material/styles';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import LoadingBar from './components/layout/LoadingBar';
import { createCustomTheme } from './lib/config/theme';
import { useSession, signOut } from 'next-auth/react';
import React, { useRef } from 'react';
import * as MuiIcons from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import PersonAddIcon from '@mui/icons-material/PersonAddOutlined';
import Tooltip from '@mui/material/Tooltip';
import Link from 'next/link';
import { AppBarNavigation } from './components/layout/AppBarNavigation';
import { mainNavLoggedOut, mainNavLoggedIn } from './components/layout/navConfig';
import { DrawerNavigation } from './components/layout/DrawerNavigation';
import { useProject } from './contexts/ProjectContext';
import CheckIcon from '@mui/icons-material/Check';

interface HideOnScrollProps {
  children: React.ReactElement;
}

interface RootLayoutProps {
  children: React.ReactNode;
}

// Hide the app bar when scrolling down and show it when scrolling up (like a sticky header)
// https://mui.com/material-ui/react-app-bar/#sticky-app-bar
// https://mui.com/material-ui/react-app-bar/#hide-on-scroll

function HideOnScroll(props: HideOnScrollProps) {
  const { children } = props;
  const trigger = useScrollTrigger();

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

export default function RootLayout({ children }: RootLayoutProps) {
  const [darkMode, setDarkMode] = useState<string | null>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [publicNavItems, setPublicNavItems] = useState<any[]>([]);
  const [navOpenStates, setNavOpenStates] = useState<Record<string, boolean>>({});
  const [menuAnchors, setMenuAnchors] = useState<Record<string, HTMLElement | null>>({}); // For public nav menus
  const { selectedProject, userProjects, isLoading, setSelectedProject } = useProject();
  const [projectMenuAnchor, setProjectMenuAnchor] = useState<HTMLElement | null>(null);
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
  const authenticatedNavItems = mainNavLoggedIn.map((item, index) => {
    const iconMap: Record<string, React.ReactElement> = {
      'Dashboard': <DashboardIcon />,
      'Events': <EventIcon />,
      'Persons': <PersonIcon />,
      'Sources': <BookIcon />,
      'Projects': <ProjectIcon />,
    };
    
    return {
      path: item.href,
      label: item.label,
      icon: iconMap[item.label] || <DashboardIcon />,
      index: index
    };
  });

  // Navigation items for public users (no register)
  // const publicNavItems = [
  //   { path: '/', label: 'Home', icon: <HomeIcon />, index: 0 },
  //   { path: '/api/auth/login', label: 'Login', icon: <LoginIcon />, index: 1 },
  // ];

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  const handleNavigate = (path: string, index: number) => {
    setOpen(false); // Close drawer when navigating
    router.push(path);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleProjectMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProjectMenuAnchor(event.currentTarget);
  };

  const handleProjectMenuClose = () => {
    setProjectMenuAnchor(null);
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
            <Stack direction="row" spacing={2} alignItems="center">
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
              {isAuthenticated && user ? (

              <Stack direction="column" spacing={-1} alignItems="left" minWidth={200} sx={{ ml: 2, pl: 2, borderLeft: '1px solid rgba(255,255,255,0.3)' }}> 
                <Typography variant="overline" component="p" sx={{ flexGrow: 1, fontWeight: 400, color: '#fff', letterSpacing: -1 }}>
                  Aktuelles Projekt
                </Typography>
                {isLoading ? (
                  <Skeleton variant="text" width={200} height={24} />
                ) : (
                <Box sx={{ position: 'relative' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body1" component="p" sx={{ flexGrow: 1, fontWeight: 400, color: '#fff', letterSpacing: -1 }}>
                    {selectedProject ? selectedProject.name : 'Kein Projekt ausgewählt'}
                  </Typography>
                  <IconButton onClick={projectMenuAnchor ? undefined : handleProjectMenuOpen}>
                    <ChangeCircleIcon />
                  </IconButton>
                </Stack>
                <Menu
                  anchorEl={projectMenuAnchor}
                  open={Boolean(projectMenuAnchor)}
                  onClose={handleProjectMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  {userProjects.map((project) => (
                    <MenuItem key={project.id} onClick={() => setSelectedProject(project)}>
                      <ListItemText primary={project.name} />
                      {selectedProject?.id === project.id && <ListItemIcon>
                        <CheckIcon />
                      </ListItemIcon>}  
                    </MenuItem>
                  ))}
                </Menu>
                </Box>
                )}
              </Stack>
            ) : null}
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
                  slotProps={{
                    paper: {
                      sx: {
                        background: 'rgba(30, 41, 59, 0.55)',
                        backdropFilter: 'blur(18px)',
                        WebkitBackdropFilter: 'blur(18px)',
                        boxShadow: '0 4px 32px 0 rgba(0,0,0,0.10)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#fff',
                      }
                    }
                  }}
                >
                  <MenuItem onClick={() => router.push('/account/profile')}>
                    <ListItemIcon>
                      <AccountCircleIcon fontSize="medium" sx={{ color: '#fff' }}/>
                    </ListItemIcon>
                    Account
                  </MenuItem>
                  <MenuItem onClick={() => router.push('/account/projekte')}>
                    <ListItemIcon>
                      <ProjectIcon fontSize="medium" sx={{ color: '#fff' }}/>
                    </ListItemIcon>
                    Projekte
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="medium" sx={{ color: '#fff' }}/>
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
                        color: 'white',
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
          <DrawerNavigation items={mainNavLoggedOut} />
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