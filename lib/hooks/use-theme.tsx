'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { ThemeMode, ThemeStorageKey } from '@/constants/enums/theme.enum';
import { ThemeErrorCode } from '@/constants/enums/error.enum';
import { AppError } from '@/errors';

interface ThemeContextValue {
  themeMode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') {
      return ThemeMode.LIGHT;
    }
    const stored = localStorage.getItem(ThemeStorageKey.MODE);
    return (stored as ThemeMode) || ThemeMode.LIGHT;
  });

  useEffect(() => {
    localStorage.setItem(ThemeStorageKey.MODE, themeMode);
    const root = document.documentElement;
    if (themeMode === ThemeMode.DARK) {
      root.classList.add(ThemeMode.DARK);
    } else {
      root.classList.remove(ThemeMode.DARK);
    }
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prev) =>
      prev === ThemeMode.LIGHT ? ThemeMode.DARK : ThemeMode.LIGHT
    );
  };

  return (
    <ThemeContext.Provider value={{ themeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new AppError(ThemeErrorCode.HOOK_OUT_OF_CONTEXT);
  }
  return context;
}
