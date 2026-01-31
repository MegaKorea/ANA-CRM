'use client';

import { type ReactNode } from 'react';
import { AntdProvider } from './AntdProvider';
import { QueryProvider } from './QueryProvider';
import { ThemeProvider } from '@/lib/hooks/use-theme';
import { NavigationProvider } from '@/lib/contexts/navigation.context';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AntdProvider>
          <NavigationProvider>{children}</NavigationProvider>
        </AntdProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

export { AntdProvider } from './AntdProvider';
export { QueryProvider } from './QueryProvider';
