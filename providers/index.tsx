'use client';

import { type ReactNode } from 'react';
import { AntdProvider } from './AntdProvider';
import { QueryProvider } from './QueryProvider';
import { ThemeProvider } from '@/lib/hooks/use-theme';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AntdProvider>{children}</AntdProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}

export { AntdProvider } from './AntdProvider';
export { QueryProvider } from './QueryProvider';
