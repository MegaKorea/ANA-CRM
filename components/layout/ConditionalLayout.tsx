'use client';

import { usePathname } from 'next/navigation';
import { CRMLayout } from './Layout';
import type { ReactNode } from 'react';
import { PUBLIC_ROUTES } from '@/constants/routes';

interface ConditionalLayoutProps {
  children: ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route)) || pathname === '/404';

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return <CRMLayout>{children}</CRMLayout>;
}
