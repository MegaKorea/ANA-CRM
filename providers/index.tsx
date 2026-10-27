'use client';

import { type ReactNode } from 'react';
import { AntdProvider } from './AntdProvider';
import { QueryProvider } from './QueryProvider';
import { ThemeProvider } from '@/lib/hooks/use-theme';
import { NavigationProvider } from '@/lib/contexts/navigation.context';
import { CurrentUserProvider } from './CurrentUserProvider';
import { MotionProvider } from './MotionProvider';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <CurrentUserProvider>
          <AntdProvider>
            <MotionProvider>
              <NavigationProvider>{children}</NavigationProvider>
            </MotionProvider>
          </AntdProvider>
        </CurrentUserProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

export { AntdProvider } from './AntdProvider';
export { QueryProvider } from './QueryProvider';
