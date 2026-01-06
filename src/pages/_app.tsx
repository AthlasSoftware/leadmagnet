import type { AppProps } from 'next/app';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';
import { ThemeModeProvider, useThemeMode } from '@/contexts/ThemeContext';
import { I18nProvider, useI18n } from '@/contexts/I18nContext';
import { useMemo } from 'react';

const getTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'light' ? '#2563eb' : '#ffffff',
      light: mode === 'light' ? '#3b82f6' : '#f5f5f5',
      dark: mode === 'light' ? '#1e40af' : '#e0e0e0',
      contrastText: mode === 'light' ? '#ffffff' : '#1e1e1e',
    },
    secondary: {
      main: mode === 'light' ? '#64748b' : '#666666',
      light: mode === 'light' ? '#94a3b8' : '#888888',
      dark: mode === 'light' ? '#475569' : '#444444',
      contrastText: '#ffffff',
    },
    background: {
      default: mode === 'light' ? '#f8fafc' : '#1e1e1e',
      paper: mode === 'light' ? '#ffffff' : '#2a2a2a',
    },
    text: {
      primary: mode === 'light' ? '#1e293b' : '#ffffff',
      secondary: mode === 'light' ? '#64748b' : '#b0b0b0',
    },
    success: {
      main: mode === 'light' ? '#22c55e' : '#4CAF50',
    },
    warning: {
      main: mode === 'light' ? '#f59e0b' : '#FF9800',
    },
    error: {
      main: mode === 'light' ? '#ef4444' : '#f44336',
    },
    divider: mode === 'light' ? '#e2e8f0' : '#404040',
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 200,
      fontSize: '3rem',
      lineHeight: 1.1,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 300,
      fontSize: '2.5rem',
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 400,
      fontSize: '2rem',
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 400,
      fontSize: '1.5rem',
      lineHeight: 1.3,
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      fontWeight: 400,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      fontWeight: 400,
    },
  },
  shape: {
    borderRadius: 2,
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0,0,0,0.8)',
    '0px 2px 4px rgba(0,0,0,0.6)',
    '0px 3px 6px rgba(0,0,0,0.5)',
    '0px 4px 8px rgba(0,0,0,0.4)',
    '0px 5px 10px rgba(0,0,0,0.35)',
    '0px 6px 12px rgba(0,0,0,0.3)',
    '0px 7px 14px rgba(0,0,0,0.25)',
    '0px 8px 16px rgba(0,0,0,0.2)',
    '0px 9px 18px rgba(0,0,0,0.18)',
    '0px 10px 20px rgba(0,0,0,0.16)',
    '0px 11px 22px rgba(0,0,0,0.14)',
    '0px 12px 24px rgba(0,0,0,0.12)',
    '0px 13px 26px rgba(0,0,0,0.1)',
    '0px 14px 28px rgba(0,0,0,0.08)',
    '0px 15px 30px rgba(0,0,0,0.06)',
    '0px 16px 32px rgba(0,0,0,0.05)',
    '0px 17px 34px rgba(0,0,0,0.04)',
    '0px 18px 36px rgba(0,0,0,0.03)',
    '0px 19px 38px rgba(0,0,0,0.02)',
    '0px 20px 40px rgba(0,0,0,0.01)',
    '0px 21px 42px rgba(0,0,0,0.01)',
    '0px 22px 44px rgba(0,0,0,0.01)',
    '0px 23px 46px rgba(0,0,0,0.01)',
    '0px 24px 48px rgba(0,0,0,0.01)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '12px 32px',
          fontSize: '0.9rem',
          fontWeight: 500,
          border: 'none',
          transition: 'all 0.2s ease',
        },
        contained: {
          boxShadow: mode === 'light' ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' : 'none',
          '&:hover': {
            boxShadow: mode === 'light' ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' : 'none',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderColor: mode === 'light' ? '#e2e8f0' : '#666666',
          '&:hover': {
            borderColor: mode === 'light' ? '#cbd5e1' : '#ffffff',
            backgroundColor: mode === 'light' ? '#f8fafc' : 'rgba(255,255,255,0.05)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${mode === 'light' ? '#e2e8f0' : '#404040'}`,
          boxShadow: mode === 'light' ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' : 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          border: `1px solid ${mode === 'light' ? '#e2e8f0' : '#404040'}`,
          borderRadius: 12,
          boxShadow: mode === 'light' ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' : 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: mode === 'light' ? '#e2e8f0' : '#404040',
            },
            '&:hover fieldset': {
              borderColor: mode === 'light' ? '#cbd5e1' : '#666666',
            },
            '&.Mui-focused fieldset': {
              borderColor: mode === 'light' ? '#2563eb' : '#ffffff',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          border: `1px solid ${mode === 'light' ? '#e2e8f0' : '#404040'}`,
          borderRadius: 12,
          '&:before': {
            display: 'none',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

function AppContent({ Component, pageProps }: AppProps) {
  const { mode } = useThemeMode();
  const theme = useMemo(() => getTheme(mode), [mode]);
  const { t } = useI18n();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Component {...pageProps} />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: mode === 'light' ? '#ffffff' : '#2a2a2a',
            color: mode === 'light' ? '#1e293b' : '#ffffff',
            borderRadius: '8px',
            border: `1px solid ${mode === 'light' ? '#e2e8f0' : '#404040'}`,
            boxShadow: mode === 'light' ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' : 'none',
          },
          success: {
            style: {
              background: mode === 'light' ? '#ffffff' : '#2a2a2a',
              color: mode === 'light' ? '#1e293b' : '#ffffff',
              border: `1px solid ${mode === 'light' ? '#22c55e' : '#4CAF50'}`,
            },
            iconTheme: {
              primary: mode === 'light' ? '#22c55e' : '#4CAF50',
              secondary: mode === 'light' ? '#ffffff' : '#2a2a2a',
            },
          },
          error: {
            style: {
              background: mode === 'light' ? '#ffffff' : '#2a2a2a',
              color: mode === 'light' ? '#1e293b' : '#ffffff',
              border: `1px solid ${mode === 'light' ? '#ef4444' : '#f44336'}`,
            },
            iconTheme: {
              primary: mode === 'light' ? '#ef4444' : '#f44336',
              secondary: mode === 'light' ? '#ffffff' : '#2a2a2a',
            },
          },
        }}
      />
    </ThemeProvider>
  );
}

export default function App(props: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Dynamic meta set in I18nHead below */}
        <meta name="author" content="PULSE by Athlas.io" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pulse.athlas.io/" />
        {/* Dynamic OG set in I18nHead below */}
        <meta property="og:site_name" content="PULSE by Athlas.io" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        {/* Dynamic Twitter set in I18nHead below */}
        
        {/* Favicons */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Theme color */}
        <meta name="theme-color" content="#2563eb" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Title set in I18nHead below */}
      </Head>
      <I18nProvider>
        <I18nHead />
        <ThemeModeProvider>
          <AppContent {...props} />
        </ThemeModeProvider>
      </I18nProvider>
    </>
  );
}

function I18nHead() {
  const { t } = useI18n();
  return (
    <Head>
      <title>{t('meta.title')}</title>
      <meta name="description" content={t('meta.description')} />
      <meta name="keywords" content={t('meta.keywords')} />
      <meta property="og:title" content={t('meta.ogTitle')} />
      <meta property="og:description" content={t('meta.ogDescription')} />
      <meta name="twitter:title" content={t('meta.twitterTitle')} />
      <meta name="twitter:description" content={t('meta.twitterDescription')} />
    </Head>
  );
}
