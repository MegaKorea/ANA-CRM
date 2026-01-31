'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageTransitionDelay } from '@/constants/enums/common.enum';

export function useDelayedNavigation() {
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

  return {
    isNavigating,
    navigateWithDelay,
    cancelNavigation,
  };
}
