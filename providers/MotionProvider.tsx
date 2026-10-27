'use client';

import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
import { type ReactNode } from 'react';

interface MotionProviderProps {
  children: ReactNode;
}

/**
 * LazyMotion + `m.*` components keep the animation runtime small (only the
 * DOM animation features are loaded), and `reducedMotion="user"` turns
 * animations off for people who ask their OS for less motion.
 */
export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
