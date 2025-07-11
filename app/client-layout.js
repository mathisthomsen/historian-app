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
  Image,
  ExpandLess,
  ExpandMore
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
import React, { useRef } from 'react';
import * as MuiIcons from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Tooltip from '@mui/material/Tooltip';

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
    window.location.href = '/api/auth/logout';
  };

  // Accessible menu open/close handlers for public nav
  const handleMenuOpen = (event, id) => {
    setMenuAnchors((prev) => ({ ...prev, [id]: event.currentTarget }));
  };
  const handleMenuClose = (id) => {
    setMenuAnchors((prev) => ({ ...prev, [id]: null }));
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

  // Debug staging detection
  useEffect(() => {
    // Removed verbose console logs for faster dev builds
  }, []);

  // Fetch navigation from Strapi for public users
  useEffect(() => {
    if (!isAuthenticated) {
      const documentId = 'ctp0vfu1o3lqz3nj3bt98kae';
      fetch(`http://localhost:1337/api/navigations/${documentId}?populate=nav_items.parent_node`)
        .then(res => res.json())
        .then(data => {
          const flatItems = data.data?.nav_items || [];
          const tree = buildNavTree(flatItems);
          setPublicNavItems(tree);
        });
    }
  }, [isAuthenticated]);

  // Build a nested tree from flat nav_items with parent_node
  function buildNavTree(flatItems) {
    const idMap = {};
    flatItems.forEach(item => {
      idMap[item.id] = { ...item, children: [] };
    });
    const tree = [];
    flatItems.forEach(item => {
      if (item.parent_node && item.parent_node.id) {
        if (idMap[item.parent_node.id]) {
          idMap[item.parent_node.id].children.push(idMap[item.id]);
        }
      } else {
        tree.push(idMap[item.id]);
      }
    });
    // Sort children by order
    function sortTree(nodes) {
      nodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          sortTree(node.children);
        }
      });
    }
    sortTree(tree);
    return tree;
  }

  // Helper to get Material UI icon by name
  function getMuiIcon(iconName) {
    console.log(iconName);
    if (!iconName) return <HomeIcon />;
    const IconComponent = MuiIcons[iconName];
    console.log(IconComponent);
    return IconComponent ? <IconComponent /> : <HomeIcon />;
  }

  // Recursive render for nested navigation
  function renderNavItems(items, level = 0) {
    return items.map((item) => (
      <React.Fragment key={item.id}>
        <ListItem disablePadding sx={{ pl: 2 * level }}>
          <ListItemButton
            selected={currentPath === item.url}
            onClick={() => {
              setOpen(false);
              router.push(item.url);
            }}
          >
            <ListItemIcon>
              {getMuiIcon(item.icon)}
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        </ListItem>
        {item.children && item.children.length > 0 && (
          <List disablePadding>
            {renderNavItems(item.children, level + 1)}
          </List>
        )}
      </React.Fragment>
    ));
  }

  // Render public nav in AppBar (first level as buttons, second level as menus)
  function renderPublicNavAppBar(items) {
    return (
      <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 2 }}>
        {items.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          if (!hasChildren) {
            return (
              <Button
                key={item.id}
                color="inherit"
                href={item.url}
                aria-label={item.label}
                sx={{ fontWeight: 500 }}
              >
                {item.label}
              </Button>
            );
          }
          return (
            <React.Fragment key={item.id}>
              <Button
                color="inherit"
                aria-haspopup="true"
                aria-controls={`menu-${item.id}`}
                aria-expanded={Boolean(menuAnchors[item.id])}
                onClick={(e) => handleMenuOpen(e, item.id)}
                sx={{ fontWeight: 500 }}
                endIcon={
                  <ExpandMoreIcon
                    aria-expanded={Boolean(menuAnchors[item.id])}
                    sx={{
                      transition: 'transform 0.2s',
                      transform: Boolean(menuAnchors[item.id]) ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  />
                }
              >
                {item.label}
              </Button>
              <Menu
                id={`menu-${item.id}`}
                anchorEl={menuAnchors[item.id]}
                open={Boolean(menuAnchors[item.id])}
                onClose={() => handleMenuClose(item.id)}
                slotProps={{
                  menuList: {
                    'aria-labelledby': `button-${item.id}`,
                    role: 'menu',
                  },
                  paper: {
                    sx: {
                      borderRadius: 1,
                      backgroundColor: 'secondary.main',
                      color: 'secondary.contrastText',
                    }
                  }
                }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                keepMounted
              >
                {item.children.map((child) => (
                  <MenuItem
                    key={child.id}
                    component="a"
                    href={child.url}
                    onClick={() => handleMenuClose(item.id)}
                    role="menuitem"
                    sx={{
                      '&:hover': {
                        backgroundColor: 'secondary.dark',
                      },
                      '&:active': {
                        backgroundColor: 'secondary.dark',
                      },  
                      '&:focus': {
                        backgroundColor: 'secondary.dark',
                      },
                      '&:focus-visible': {
                        backgroundColor: 'secondary.dark',
                      },
                      '&:focus-within': {
                        backgroundColor: 'secondary.dark',
                      },
                      paddingInline: 3,
                      paddingBlock: 1,
                    }}
                  >
                    <ListItemIcon sx={{ color: 'secondary.contrastText' }}>
                      {getMuiIcon(child.icon)}
                    </ListItemIcon>
                    <ListItemText primary={child.label} />
                  </MenuItem>
                ))}
              </Menu>
            </React.Fragment>
          );
        })}
      </Stack>
    );
  }

  // Render public nav for Drawer (mobile)
  function renderPublicNavDrawer(items) {
    return (
      <List>
        {items.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          if (!hasChildren) {
            return (
              <ListItem key={item.id} disablePadding>
                <ListItemButton
                  component="a"
                  href={item.url}
                  onClick={() => setPublicDrawerOpen(false)}
                  sx={{ fontWeight: 500 }}
                >
                  <ListItemIcon>
                    {getMuiIcon(item.icon)}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            );
          }
          return (
            <React.Fragment key={item.id}>
              <ListItem disablePadding>
                <ListItemButton
                  aria-haspopup="true"
                  aria-controls={`drawer-menu-${item.id}`}
                  aria-expanded={false}
                  sx={{ fontWeight: 500 }}
                >
                  <ListItemIcon>
                    {getMuiIcon(item.icon)}
                  </ListItemIcon>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
              {item.children.map((child) => (
                <ListItem key={child.id} disablePadding sx={{ pl: 4 }}>
                  <ListItemButton
                    component="a"
                    href={child.url}
                    onClick={() => setPublicDrawerOpen(false)}
                  >
                    <ListItemIcon>
                      {getMuiIcon(child.icon)}
                    </ListItemIcon>
                    <ListItemText primary={child.label} />
                  </ListItemButton>
                </ListItem>
              ))}
            </React.Fragment>
          );
        })}
      </List>
    );
  }

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
              <img src="/logo1.svg" alt="Evidoxa App" height={56} />
              <Typography variant="h6" component="p" sx={{ flexGrow: 1, fontWeight: 400, color: '#fff', letterSpacing: -1 }}>
                Evidoxa
              </Typography>
              {/* Public navigation in AppBar (md+) */}
              {!isAuthenticated && isMdUp && renderPublicNavAppBar(publicNavItems)}
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
              isMdUp ? (
                <Stack direction="row" spacing={2}>
                  <Button color="inherit" onClick={() => window.location.href = 'https://hopeful-bubble-54-staging.authkit.app/sign-up'}>
                    Registrieren
                  </Button>
                  <Button color="inherit" onClick={() => window.location.href = '/api/auth/login'}>
                    Login
                  </Button>
                </Stack>
              ) : (
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Registrieren">
                    <IconButton color="inherit" aria-label="Registrieren" onClick={() => window.location.href = 'https://hopeful-bubble-54-staging.authkit.app/sign-up'}>
                      <PersonAddIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Login">
                    <IconButton color="inherit" aria-label="Login" onClick={() => window.location.href = '/api/auth/login'}>
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
      >
        <List>
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
        >
          {renderPublicNavDrawer(publicNavItems)}
        </Drawer>
      )}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: { xs: '56px', md: '64px' },
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
