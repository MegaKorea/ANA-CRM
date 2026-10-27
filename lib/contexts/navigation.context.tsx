'use client';

import { createContext, useContext, useCallback, useMemo, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface NavigationContextValue {
  /** True while a route pushed through `navigate` is still loading. */
  isNavigating: boolean;
  navigate: (path: string) => void;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const router = useRouter();
  // Navigating inside a transition keeps the current page interactive while
  // the next one loads, and `isPending` drives the top progress bar.
  const [isNavigating, startTransition] = useTransition();

  const navigate = useCallback(
    (path: string) => {
      startTransition(() => router.push(path));
    },
    [router]
  );

  const contextValue = useMemo(() => ({ isNavigating, navigate }), [isNavigating, navigate]);

  return (
    <NavigationContext.Provider value={contextValue}>
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
