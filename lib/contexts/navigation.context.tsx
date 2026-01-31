'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { PageTransitionDelay } from '@/constants/enums/common.enum';

interface NavigationContextValue {
  isNavigating: boolean;
  navigateWithDelay: (path: string) => void;
  cancelNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const navigateWithDelay = useCallback(
    (path: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      setIsNavigating(true);

      timeoutRef.current = setTimeout(() => {
        router.push(path);
        setIsNavigating(false);
        timeoutRef.current = null;
      }, PageTransitionDelay.DEFAULT);
    },
    [router]
  );

  const cancelNavigation = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsNavigating(false);
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        isNavigating,
        navigateWithDelay,
        cancelNavigation,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
