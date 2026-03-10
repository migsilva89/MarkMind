export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export interface UseThemeReturn {
  theme: ResolvedTheme;
  themePreference: ThemePreference;
  toggleTheme: () => void;
}
