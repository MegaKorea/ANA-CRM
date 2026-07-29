'use client';

import { type ReactNode } from 'react';
import { useCurrentUser } from '@/lib/hooks/use-current-user';

function CurrentUserBootstrap({ children }: { children: ReactNode }) {
  useCurrentUser();
  return children;
}

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  return <CurrentUserBootstrap>{children}</CurrentUserBootstrap>;
}
