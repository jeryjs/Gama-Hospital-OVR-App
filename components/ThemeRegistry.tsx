'use client';

import * as React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { getTheme } from '@/lib/theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

export function useThemeMode(): ThemeContextValue {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a ThemeRegistry');
  }
  return context;
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') return getSystemTheme();
  return mode;
}

function setThemeCookie(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.cookie = `theme-mode=${mode}; path=/; max-age=31536000; SameSite=Lax`;
}

interface ThemeRegistryProviderProps {
  children: React.ReactNode;
  initialMode?: ThemeMode;
  initialResolvedMode?: 'light' | 'dark';
}

function ThemeRegistryProvider({ children, initialMode, initialResolvedMode }: ThemeRegistryProviderProps) {
  const [mode, setMode] = React.useState<ThemeMode>(() => initialMode ?? 'system');
  const [resolvedMode, setResolvedMode] = React.useState<'light' | 'dark'>(() =>
    initialResolvedMode ?? (typeof window !== 'undefined' ? resolveMode(mode) : 'dark')
  );

  // Listen for system theme changes
  React.useEffect(() => {
    if (mode !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const newMode = e.matches ? 'dark' : 'light';
      setResolvedMode(newMode);
      document.documentElement.setAttribute('data-theme', newMode);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [mode]);

  // Apply theme changes
  React.useEffect(() => {
    const effectiveMode = mode === 'system' ? resolvedMode : mode;
    localStorage.setItem('theme-mode', mode);
    setThemeCookie(mode);
    document.documentElement.setAttribute('data-theme', effectiveMode);
    setResolvedMode(effectiveMode);
  }, [mode, resolvedMode]);

  const theme = React.useMemo(() => getTheme(resolvedMode), [resolvedMode]);

  const setModeWithPersistence = React.useCallback((newMode: ThemeMode) => {
    setMode(newMode);
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, resolvedMode, setMode: setModeWithPersistence }}>
      <AppRouterCacheProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </AppRouterCacheProvider>
    </ThemeContext.Provider>
  );
}

export function ThemeRegistry({
  children,
  initialMode,
  initialResolvedMode
}: {
  children: React.ReactNode;
  initialMode?: ThemeMode;
  initialResolvedMode?: 'light' | 'dark';
}) {
  return <ThemeRegistryProvider initialMode={initialMode} initialResolvedMode={initialResolvedMode}>{children}</ThemeRegistryProvider>;
}
