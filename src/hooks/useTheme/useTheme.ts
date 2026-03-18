import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { ThemePreference, ResolvedTheme, UseThemeReturn } from './types';

const STORAGE_KEY_THEME = 'themePreference';
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

const resolveTheme = (preference: ThemePreference): ResolvedTheme => {
  if (preference === 'system') {
    return window.matchMedia(DARK_MEDIA_QUERY).matches ? 'dark' : 'light';
  }
  return preference;
};

const applyTheme = (theme: ResolvedTheme): void => {
  document.documentElement.setAttribute('data-theme', theme);
};

const readThemeFromLocalStorage = (): { preference: ThemePreference; resolved: ResolvedTheme } => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_THEME) as ThemePreference | null;
    if (saved === 'dark' || saved === 'light') {
      return { preference: saved, resolved: saved };
    }
  } catch (error) {
    console.error('Failed to read theme from localStorage:', error);
  }
  return { preference: 'system', resolved: resolveTheme('system') };
};

export const useTheme = (): UseThemeReturn => {
  const initial = readThemeFromLocalStorage();
  const [themePreference, setThemePreference] = useState<ThemePreference>(initial.preference);
  const [theme, setTheme] = useState<ResolvedTheme>(initial.resolved);

  // Runs synchronously BEFORE browser paint — sets data-theme on DOM immediately
  useLayoutEffect(() => {
    applyTheme(initial.resolved);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Confirm from chrome.storage.local (source of truth) and sync localStorage
  useEffect(() => {
    const loadSavedPreference = async (): Promise<void> => {
      try {
        const result = await chrome.storage.local.get(STORAGE_KEY_THEME);
        const savedPreference = (result[STORAGE_KEY_THEME] as ThemePreference) || 'system';
        const resolved = resolveTheme(savedPreference);
        localStorage.setItem(STORAGE_KEY_THEME, savedPreference);
        setThemePreference(savedPreference);
        setTheme(resolved);
        applyTheme(resolved);
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };

    loadSavedPreference();
  }, []);

  // Listen for system theme changes when preference is 'system'
  useEffect(() => {
    if (themePreference !== 'system') return;

    const mediaQuery = window.matchMedia(DARK_MEDIA_QUERY);
    const handleSystemThemeChange = (event: MediaQueryListEvent): void => {
      const resolved = event.matches ? 'dark' : 'light';
      setTheme(resolved);
      applyTheme(resolved);
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [themePreference]);

  const toggleTheme = useCallback((): void => {
    const nextTheme: ResolvedTheme = theme === 'light' ? 'dark' : 'light';
    setThemePreference(nextTheme);
    setTheme(nextTheme);
    applyTheme(nextTheme);
    localStorage.setItem(STORAGE_KEY_THEME, nextTheme);
    chrome.storage.local.set({ [STORAGE_KEY_THEME]: nextTheme }).catch((error) => {
      console.error('Failed to save theme preference:', error);
    });
  }, [theme]);

  return { theme, themePreference, toggleTheme };
};
