'use client';

import { type ReactNode } from 'react';
import { AntdProvider } from './AntdProvider';
import { QueryProvider } from './QueryProvider';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <AntdProvider>{children}</AntdProvider>
    </QueryProvider>
  );
}

export { AntdProvider } from './AntdProvider';
export { QueryProvider } from './QueryProvider';
