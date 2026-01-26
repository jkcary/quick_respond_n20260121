/**
 * Theme System with Dark/Light/Auto modes
 * Auto mode switches based on time of day (6am-6pm = light, 6pm-6am = dark)
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'dark' | 'light' | 'auto';
export type ResolvedTheme = 'dark' | 'light';

interface ThemeContextValue {
  mode: ThemeMode;
  theme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'eaa-theme-mode';
const LIGHT_START_HOUR = 6;  // 6 AM
const LIGHT_END_HOUR = 18;   // 6 PM

function getTimeBasedTheme(): ResolvedTheme {
  const hour = new Date().getHours();
  return hour >= LIGHT_START_HOUR && hour < LIGHT_END_HOUR ? 'light' : 'dark';
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'auto') {
    return getTimeBasedTheme();
  }
  return mode;
}

function getStoredMode(): ThemeMode {
  if (typeof window === 'undefined') return 'auto';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'light' || stored === 'auto') {
    return stored;
  }
  return 'auto';
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => getStoredMode());
  const [theme, setTheme] = useState<ResolvedTheme>(() => resolveTheme(getStoredMode()));

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
    setTheme(resolveTheme(newMode));
  }, []);

  const toggleTheme = useCallback(() => {
    // Cycle through: auto -> light -> dark -> auto
    const nextMode: ThemeMode = mode === 'auto' ? 'light' : mode === 'light' ? 'dark' : 'auto';
    setMode(nextMode);
  }, [mode, setMode]);

  // Update theme when mode is auto and time changes
  useEffect(() => {
    if (mode !== 'auto') return;

    const checkTime = () => {
      const newTheme = getTimeBasedTheme();
      setTheme((current) => (current !== newTheme ? newTheme : current));
    };

    // Check every minute
    const interval = setInterval(checkTime, 60000);
    checkTime();

    return () => clearInterval(interval);
  }, [mode]);

  // Apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);

    // Also set data attribute for CSS selectors
    root.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ mode, theme, setMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
