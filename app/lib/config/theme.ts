import { createTheme } from '@mui/material/styles';

export function createCustomTheme(mode: 'light' | 'dark') {
  const isDark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#80e5dd' : '#009688', // frisches, kühles Cyan
        contrastText: isDark ? '#0f172a' : '#ffffff',
      },
      secondary: {
        main: isDark ? '#B4CDE8' : '#1f2c4c', // dunkles marineblau
        contrastText: isDark ? '#0f172a' : '#ffffff',
      },
      background: {
        default: isDark ? '#121c24' : '#ffffff',
        paper: isDark ? '#1c2730' : '#ffffff',
      },
      error: {
        main: isDark ? '#ef9a9a' : '#c62828', // etwas gedeckter als klassisch rot
      },
      warning: {
        main: isDark ? '#ffe082' : '#ef6c00', // warmer Bernstein-Ton, sehr lesbar
      },
      info: {
        main: isDark ? '#8de3e1' : '#00acc1', // cyanischer Akzent, passend zum Primary
      },
      success: {
        main: isDark ? '#a5d6a7' : '#2e7d32', // leicht kühler Grünton, sehr angenehm
      },
      divider: isDark ? '#37474f' : '#e0e0e0',
      text: {
        primary: isDark ? '#f1f5f9' : '#1e293b',
        secondary: isDark ? '#9eb2c4' : '#475569',
      },
    },
    typography: {
      fontFamily: 'Geist, Inter, Roboto, Arial, sans-serif',
      h1: { fontWeight: 700, letterSpacing: '-0.02em' },
      h2: { fontWeight: 700, letterSpacing: '-0.02em' },
      h3: { fontWeight: 700, letterSpacing: '-0.01em' },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 600,
            boxShadow: 'none',
            transition: 'background 0.2s',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            boxShadow: isDark
              ? '0 2px 8px 0 rgba(30,41,59,0.7)'
              : '0 2px 8px 0 rgba(100,116,139,0.08)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: 'palette.primary.main',
            color: 'palette.primary.contrastText',
          },
        },
      },
    },
  });
} 