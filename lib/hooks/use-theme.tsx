'use client';

import {
  createContext,
  useContext,
  useSyncExternalStore,
  useMemo,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { ThemeMode, ThemeStorageKey } from '@/constants/enums/theme.enum';
import { ThemeErrorCode } from '@/constants/enums/error.enum';
import { AppError } from '@/errors';

interface ThemeContextValue {
  themeMode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

let currentTheme: ThemeMode = ThemeMode.LIGHT;
const listeners = new Set<() => void>();

function applyDocumentTheme(mode: ThemeMode): void {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  if (mode === ThemeMode.DARK) {
    root.classList.add(ThemeMode.DARK);
  } else {
    root.classList.remove(ThemeMode.DARK);
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === ThemeStorageKey.MODE && (e.newValue === ThemeMode.LIGHT || e.newValue === ThemeMode.DARK)) {
      currentTheme = e.newValue as ThemeMode;
      applyDocumentTheme(currentTheme);
      listeners.forEach((l) => l());
    }
  };
  window.addEventListener('storage', handleStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', handleStorage);
  };
}

function getSnapshot(): ThemeMode {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(ThemeStorageKey.MODE);
    if (stored === ThemeMode.DARK || stored === ThemeMode.LIGHT) {
      return stored as ThemeMode;
    }
  }
  return currentTheme;
}

function getServerSnapshot(): ThemeMode {
  return ThemeMode.LIGHT;
}

const THEME_SWITCHING_CLASS = 'theme-switching';

function setTheme(mode: ThemeMode) {
  currentTheme = mode;
  if (typeof window !== 'undefined') {
    localStorage.setItem(ThemeStorageKey.MODE, mode);
    // Pause CSS transitions for the swap so every surface changes colour in
    // the same frame instead of each one fading at its own speed.
    const root = document.documentElement;
    root.classList.add(THEME_SWITCHING_CLASS);
    applyDocumentTheme(mode);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.remove(THEME_SWITCHING_CLASS));
    });
  }
  listeners.forEach((l) => l());
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const themeMode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    applyDocumentTheme(themeMode);
  }, [themeMode]);

  const toggleTheme = useCallback(() => {
    const nextTheme = themeMode === ThemeMode.LIGHT ? ThemeMode.DARK : ThemeMode.LIGHT;
    setTheme(nextTheme);
  }, [themeMode]);

  const contextValue = useMemo(
    () => ({ themeMode, toggleTheme }),
    [themeMode, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
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
