import { createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { buildLightTheme, buildDarkTheme } from '../theme';

const ThemeContext = createContext({ mode: 'light', toggleTheme: () => {}, brandColor: null, setBrandColor: () => {} });

export function useThemeMode() {
  return useContext(ThemeContext);
}

export function AppThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('urload_theme') || 'light');
  const [brandColor, setBrandColorState] = useState(() => localStorage.getItem('urload_brand_color') || null);

  const toggleTheme = () => {
    setMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('urload_theme', next);
      return next;
    });
  };

  const setBrandColor = (color) => {
    if (color) {
      localStorage.setItem('urload_brand_color', color);
    } else {
      localStorage.removeItem('urload_brand_color');
    }
    setBrandColorState(color || null);
  };

  const theme = useMemo(
    () => mode === 'dark' ? buildDarkTheme(brandColor) : buildLightTheme(brandColor),
    [mode, brandColor]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, brandColor, setBrandColor }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
}
