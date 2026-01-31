'use client';

import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
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
  // 初始状态始终使用 LIGHT，避免服务器和客户端不匹配
  const [themeMode, setThemeMode] = useState<ThemeMode>(ThemeMode.LIGHT);
  const [mounted, setMounted] = useState(false);

  // 在客户端挂载后，从 localStorage 读取主题设置
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(ThemeStorageKey.MODE);
    if (stored && (stored === ThemeMode.LIGHT || stored === ThemeMode.DARK)) {
      setThemeMode(stored as ThemeMode);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(ThemeStorageKey.MODE, themeMode);
    const root = document.documentElement;
    if (themeMode === ThemeMode.DARK) {
      root.classList.add(ThemeMode.DARK);
    } else {
      root.classList.remove(ThemeMode.DARK);
    }
  }, [themeMode, mounted]);

  const toggleTheme = useCallback(() => {
    setThemeMode((prev) =>
      prev === ThemeMode.LIGHT ? ThemeMode.DARK : ThemeMode.LIGHT
    );
  }, []);

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
