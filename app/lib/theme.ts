import { createTheme } from '@mui/material/styles';

export function createCustomTheme(mode: 'light' | 'dark') {
  const isDark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#26a69a' : '#00796b',
        contrastText: isDark ? '#0f172a' : '#fff',
      },
      secondary: {
        main: isDark ? '#f8bbd0' : '#f06292',
        contrastText: isDark ? '#0f172a' : '#fff',
      },
      background: {
        default: isDark ? '#1a2224' : '#f8fafc',
        paper: isDark ? '#23292b' : '#fff',
      },
      error: {
        main: isDark ? '#ef9a9a' : '#d32f2f',
      },
      warning: {
        main: isDark ? '#ffe082' : '#ffa000',
      },
      info: {
        main: isDark ? '#80cbc4' : '#0288d1',
      },
      success: {
        main: isDark ? '#a5d6a7' : '#388e3c',
      },
      divider: isDark ? '#37474f' : '#e0e0e0',
      text: {
        primary: isDark ? '#f1f5f9' : '#1e293b',
        secondary: isDark ? '#b0bec5' : '#64748b',
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
            borderRadius: 16,
            boxShadow: isDark
              ? '0 2px 8px 0 rgba(30,41,59,0.7)'
              : '0 2px 8px 0 rgba(100,116,139,0.08)',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: isDark ? '#23292b' : '#00796b',
            color: isDark ? '#f1f5f9' : '#fff',
          },
        },
      },
    },
  });
} 