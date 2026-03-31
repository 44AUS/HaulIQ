import { createTheme } from '@mui/material/styles';

const baseTokens = {
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600 },
        sizeMedium: { padding: '8px 20px' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.75rem' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 700 },
      },
    },
  },
};

export function buildLightTheme(brandColor) {
  return createTheme({
  ...baseTokens,
  palette: {
    mode: 'light',
    primary:   { main: '#1565C0', light: '#5E92F3', dark: '#003c8f', contrastText: '#fff' },
    secondary: { main: '#E65100', light: '#FF833A', dark: '#AC1900', contrastText: '#fff' },
    success:   { main: '#2E7D32' },
    warning:   { main: '#F57F17' },
    error:     { main: '#C62828' },
    background: { default: '#F0F4F8', paper: '#FFFFFF' },
    text:      { primary: '#0D1B2A', secondary: '#546E7A' },
    divider:   'rgba(0,0,0,0.10)',
  },
  components: {
    ...baseTokens.components,
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: '#FFFFFF',
          color: '#0D1B2A',
          boxShadow: '0 1px 0 rgba(0,0,0,0.08)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: '#FFFFFF',
          color: '#0D1B2A',
          borderRight: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 0,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            background: '#F0F4F8',
            fontWeight: 700,
            color: '#546E7A',
            textTransform: 'uppercase',
            fontSize: '0.72rem',
            letterSpacing: '0.05em',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          margin: 0,
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: { color: 'inherit', minWidth: 36 },
      },
    },
  },
  });
}

// Legacy static exports kept for any existing imports
export const lightTheme = buildLightTheme(null);

export function buildDarkTheme(brandColor) {
  return createTheme({
  ...baseTokens,
  palette: {
    mode: 'dark',
    primary:   { main: '#5E92F3', light: '#90CAF9', dark: '#1565C0', contrastText: '#fff' },
    secondary: { main: '#FF833A', light: '#FFAD75', dark: '#E65100', contrastText: '#fff' },
    success:   { main: '#66BB6A' },
    warning:   { main: '#FFA726' },
    error:     { main: '#EF5350' },
    background: { default: '#121212', paper: '#1E1E1E' },
    text:      { primary: '#F0F4F8', secondary: '#9E9E9E' },
    divider:   'rgba(255,255,255,0.08)',
  },
  components: {
    ...baseTokens.components,
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: '#252525',
          color: '#F0F4F8',
          boxShadow: '0 1px 0 rgba(255,255,255,0.06)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: '#1E1E1E',
          color: '#FFFFFF',
          borderRight: 'none',
          borderRadius: 0,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: 'none',
          background: '#1E1E1E',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-root': {
            background: '#121212',
            fontWeight: 700,
            color: '#90A4AE',
            textTransform: 'uppercase',
            fontSize: '0.72rem',
            letterSpacing: '0.05em',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          margin: 0,
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: { color: 'inherit', minWidth: 36 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
  });
}

export const darkTheme = buildDarkTheme(null);
