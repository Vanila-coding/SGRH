import { useEffect, useState } from 'react';
import { ThemeContext } from './ThemeContext';

const THEME_KEY = 'rh_theme';

function resolveIsDark(theme) {
  if (theme === 'system') return window.matchMedia('(prefers-color-scheme: dark)').matches;
  return theme === 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem(THEME_KEY) || 'light');

  useEffect(() => {
    const apply = () => document.documentElement.classList.toggle('dark', resolveIsDark(theme));
    apply();
    localStorage.setItem(THEME_KEY, theme);
    if (theme !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', apply);
    return () => mql.removeEventListener('change', apply);
  }, [theme]);

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    fetch(`${API_URL}/site-settings`)
      .then((res) => res.json())
      .then((data) => {
        const settings = data.settings || {};
        Object.entries(settings).forEach(([key, value]) => {
          const cssVarName = `--${key.replace('color_', 'color-').replace(/_/g, '-')}`;
          document.documentElement.style.setProperty(cssVarName, value);
        });
      })
      .catch(() => {});
  }, []);

  function toggleTheme() {
    setThemeState((prev) => (resolveIsDark(prev) ? 'light' : 'dark'));
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState, toggleTheme, isDark: resolveIsDark(theme) }}>
      {children}
    </ThemeContext.Provider>
  );
}
