'use client';

import { createTheme, alpha } from '@mui/material/styles';

// Neon-inspired color palette
const colors = {
  neonGreen: '#00E599',
  neonBlue: '#00D1FF',
  neonPurple: '#B84FFF',
  darkBg: '#0A0A0A',
  darkCard: '#141414',
  darkElevated: '#1A1A1A',
  darkBorder: '#2A2A2A',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1A1',
  textMuted: '#666666',
};

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: colors.neonGreen,
      light: alpha(colors.neonGreen, 0.8),
      dark: alpha(colors.neonGreen, 0.9),
      contrastText: colors.darkBg,
    },
    secondary: {
      main: colors.neonBlue,
      light: alpha(colors.neonBlue, 0.8),
      dark: alpha(colors.neonBlue, 0.9),
      contrastText: colors.darkBg,
    },
    error: {
      main: '#EF4444',
      light: '#FCA5A5',
      dark: '#DC2626',
    },
    warning: {
      main: '#F59E0B',
      light: '#FCD34D',
      dark: '#D97706',
    },
    info: {
      main: colors.neonBlue,
      light: alpha(colors.neonBlue, 0.8),
      dark: alpha(colors.neonBlue, 0.9),
    },
    success: {
      main: colors.neonGreen,
      light: alpha(colors.neonGreen, 0.8),
      dark: alpha(colors.neonGreen, 0.9),
    },
    background: {
      default: colors.darkBg,
      paper: colors.darkCard,
    },
    divider: colors.darkBorder,
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
      disabled: colors.textMuted,
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '0.9375rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: `${colors.darkBorder} ${colors.darkBg}`,
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: colors.darkBg,
          },
          '&::-webkit-scrollbar-thumb': {
            background: colors.darkBorder,
            borderRadius: '4px',
            '&:hover': {
              background: alpha(colors.neonGreen, 0.3),
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          padding: '8px 16px',
          fontWeight: 500,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: `0 4px 12px ${alpha(colors.neonGreen, 0.3)}`,
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: `0 4px 12px ${alpha(colors.neonGreen, 0.3)}`,
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: colors.darkCard,
          borderRadius: '12px',
          border: `1px solid ${colors.darkBorder}`,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        elevation1: {
          boxShadow: `0 1px 3px ${alpha('#000', 0.3)}`,
        },
        elevation2: {
          boxShadow: `0 4px 6px ${alpha('#000', 0.3)}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: `1px solid ${colors.darkBorder}`,
          borderRadius: '12px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: alpha(colors.neonGreen, 0.5),
            boxShadow: `0 4px 20px ${alpha(colors.neonGreen, 0.1)}`,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: colors.darkElevated,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '& fieldset': {
              borderColor: colors.darkBorder,
              transition: 'border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            },
            '&:hover fieldset': {
              borderColor: alpha(colors.neonGreen, 0.5),
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.neonGreen,
              borderWidth: '2px',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: colors.darkElevated,
          '& fieldset': {
            borderColor: colors.darkBorder,
          },
          '&:hover fieldset': {
            borderColor: alpha(colors.neonGreen, 0.5),
          },
          '&.Mui-focused fieldset': {
            borderColor: colors.neonGreen,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          fontWeight: 500,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        filled: {
          backgroundColor: alpha(colors.neonGreen, 0.15),
          color: colors.neonGreen,
          border: `1px solid ${alpha(colors.neonGreen, 0.3)}`,
          '&:hover': {
            backgroundColor: alpha(colors.neonGreen, 0.25),
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.darkCard,
          borderRight: `1px solid ${colors.darkBorder}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(colors.darkCard, 0.8),
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${colors.darkBorder}`,
          boxShadow: 'none',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          marginBottom: '4px',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: alpha(colors.neonGreen, 0.08),
          },
          '&.Mui-selected': {
            backgroundColor: alpha(colors.neonGreen, 0.15),
            borderLeft: `3px solid ${colors.neonGreen}`,
            '&:hover': {
              backgroundColor: alpha(colors.neonGreen, 0.2),
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: colors.darkCard,
          backgroundImage: 'none',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: colors.darkElevated,
          color: colors.textPrimary,
          border: `1px solid ${colors.darkBorder}`,
          fontSize: '0.8125rem',
          padding: '8px 12px',
        },
        arrow: {
          color: colors.darkElevated,
          '&::before': {
            border: `1px solid ${colors.darkBorder}`,
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
          backgroundColor: alpha(colors.neonGreen, 0.1),
        },
        bar: {
          borderRadius: '4px',
          background: `linear-gradient(90deg, ${colors.neonGreen}, ${colors.neonBlue})`,
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          '&.Mui-active': {
            color: colors.neonGreen,
            fontWeight: 600,
          },
          '&.Mui-completed': {
            color: colors.textSecondary,
          },
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          '&.Mui-active': {
            color: colors.neonGreen,
          },
          '&.Mui-completed': {
            color: colors.neonGreen,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${colors.darkBorder}`,
        },
        indicator: {
          backgroundColor: colors.neonGreen,
          height: '3px',
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.9375rem',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&.Mui-selected': {
            color: colors.neonGreen,
          },
          '&:hover': {
            color: alpha(colors.neonGreen, 0.8),
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${colors.darkBorder}`,
        },
        head: {
          fontWeight: 600,
          backgroundColor: colors.darkElevated,
        },
      },
    },
  },
});

// Custom animation variants for framer-motion
export const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.6, ease: 'easeInOut' },
};

export const slideIn = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 20, opacity: 0 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
};

export const scaleIn = {
  initial: { scale: 0.95, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.95, opacity: 0 },
  transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
};
