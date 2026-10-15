import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1e40af', // Deep blue with high contrast
      light: '#3b82f6',
      dark: '#1e3a8a',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#0d9488', // Teal
      light: '#14b8a6',
      dark: '#0f766e',
      contrastText: '#ffffff'
    },
    background: {
      default: '#f8fafc',
      paper: '#ffffff'
    },
    text: {
      primary: '#0f172a',
      secondary: '#475569'
    },
    error: {
      main: '#dc2626'
    },
    warning: {
      main: '#f59e0b'
    },
    info: {
      main: '#2563eb'
    },
    success: {
      main: '#16a34a'
    }
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif'
    ].join(','),
    h1: {
      fontSize: '2.25rem',
      fontWeight: 700,
      color: '#0f172a'
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 600,
      color: '#0f172a'
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#0f172a'
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#0f172a'
    },
    button: {
      textTransform: 'none',
      fontWeight: 600
    }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 18px',
          boxShadow: 'none',
          '&:focus-visible': {
            outline: '2px solid #3b82f6',
            outlineOffset: '2px'
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e2e8f0'
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small'
      }
    }
  }
});

export default theme;
