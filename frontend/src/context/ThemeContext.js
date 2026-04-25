import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
  brandColor: null,
  setBrandColor: () => {},
});

export function useThemeMode() {
  return useContext(ThemeContext);
}

function applyTheme(mode, brandColor) {
  const isDark = mode === 'dark';
  document.body.classList.toggle('dark', isDark);

  const primary = brandColor || '#1565C0';
  document.documentElement.style.setProperty('--ion-color-primary', primary);
  document.documentElement.style.setProperty('--app-bar-color', primary);

  // Derive a shade (~15% darker) and tint (~15% lighter) from hex
  try {
    const r = parseInt(primary.slice(1, 3), 16);
    const g = parseInt(primary.slice(3, 5), 16);
    const b = parseInt(primary.slice(5, 7), 16);
    const shade = `rgb(${Math.max(0,r-30)},${Math.max(0,g-30)},${Math.max(0,b-30)})`;
    const tint  = `rgb(${Math.min(255,r+30)},${Math.min(255,g+30)},${Math.min(255,b+30)})`;
    document.documentElement.style.setProperty('--ion-color-primary-shade', shade);
    document.documentElement.style.setProperty('--ion-color-primary-tint',  tint);
    document.documentElement.style.setProperty('--ion-color-primary-rgb', `${r},${g},${b}`);
  } catch {}
}

export function AppThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('urload_theme') || 'light');
  const [brandColor, setBrandColorState] = useState(() => localStorage.getItem('urload_brand_color') || null);

  useEffect(() => { applyTheme(mode, brandColor); }, [mode, brandColor]);

  const toggleTheme = () => {
    setMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('urload_theme', next);
      return next;
    });
  };

  const setBrandColor = (color) => {
    if (color) localStorage.setItem('urload_brand_color', color);
    else localStorage.removeItem('urload_brand_color');
    setBrandColorState(color || null);
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, brandColor, setBrandColor }}>
      {children}
    </ThemeContext.Provider>
  );
}
