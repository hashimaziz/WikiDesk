import { useEffect, useState, type ReactNode } from 'react';
import { getSettings, updateSettings } from '../lib/db-client';
import { FONT_MIN, FONT_MAX, WIDTH_MIN, WIDTH_MAX } from '../lib/constants';
import { AppContext } from './context';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function AppProvider({ children }: { children: ReactNode }) {
  const [focusMode, setFocusMode] = useState(false);
  // Defaults mirror the DB schema so first paint matches what will be loaded.
  const [fontSize, setFontSizeState] = useState(18);
  const [contentWidth, setContentWidthState] = useState(768);
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    getSettings()
      .then((settings) => {
        setFontSizeState(settings.font_size);
        setContentWidthState(settings.content_width);
        setThemeState(settings.theme);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const setFontSize = (value: number) => {
    const next = clamp(value, FONT_MIN, FONT_MAX);
    setFontSizeState(next);
    updateSettings({ font_size: next }).catch((err) => console.error(err));
  };

  const setContentWidth = (value: number) => {
    const next = clamp(value, WIDTH_MIN, WIDTH_MAX);
    setContentWidthState(next);
    updateSettings({ content_width: next }).catch((err) => console.error(err));
  };

  const setTheme = (value: 'light' | 'dark') => {
    setThemeState(value);
    updateSettings({ theme: value }).catch((err) => console.error(err));
  };

  return (
    <AppContext.Provider
      value={{ focusMode, setFocusMode, fontSize, setFontSize, contentWidth, setContentWidth, theme, setTheme }}
    >
      {children}
    </AppContext.Provider>
  );
}
