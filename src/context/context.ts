import { createContext } from 'react';

export interface AppSettings {
  focusMode: boolean;
  setFocusMode: (value: boolean) => void;
  fontSize: number;
  setFontSize: (value: number) => void;
  contentWidth: number;
  setContentWidth: (value: number) => void;
  theme: 'light' | 'dark';
  setTheme: (value: 'light' | 'dark') => void;
}

export const AppContext = createContext<AppSettings | undefined>(undefined);
