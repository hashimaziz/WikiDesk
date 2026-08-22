import { createContext, useContext, useState, type ReactNode, type Dispatch, type SetStateAction } from 'react';

interface AppSettings {
  focusMode: boolean;
  setFocusMode: (value: boolean) => void;
  fontSize: number;
  setFontSize: Dispatch<SetStateAction<number>>;
  theme: 'light' | 'dark';
  setTheme: (value: 'light' | 'dark') => void;
}

const AppContext = createContext<AppSettings | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [focusMode, setFocusMode] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  return (
    <AppContext.Provider value={{ focusMode, setFocusMode, fontSize, setFontSize, theme, setTheme }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
