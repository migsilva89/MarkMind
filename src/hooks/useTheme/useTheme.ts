import { useState, useEffect, useCallback } from 'react';
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

export const useTheme = (): UseThemeReturn => {
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [theme, setTheme] = useState<ResolvedTheme>(() => resolveTheme('system'));

  useEffect(() => {
    const loadSavedPreference = async (): Promise<void> => {
      try {
        const result = await chrome.storage.local.get(STORAGE_KEY_THEME);
        const savedPreference = (result[STORAGE_KEY_THEME] as ThemePreference) || 'system';
        setThemePreference(savedPreference);
        const resolved = resolveTheme(savedPreference);
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

    chrome.storage.local.set({ [STORAGE_KEY_THEME]: nextTheme }).catch((error) => {
      console.error('Failed to save theme preference:', error);
    });
  }, [theme]);

  return { theme, themePreference, toggleTheme };
};
