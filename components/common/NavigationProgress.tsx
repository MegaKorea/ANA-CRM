'use client';

import { AnimatePresence, m } from 'motion/react';
import styles from './NavigationProgress.module.scss';

interface NavigationProgressProps {
  visible: boolean;
}

/** Slim top bar shown while a route transition is pending; never blocks the page. */
export function NavigationProgress({ visible }: NavigationProgressProps) {
  return (
    <AnimatePresence>
      {visible && (
        <m.div
          className={styles.bar}
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 0.85, transition: { duration: 2.5, ease: [0.1, 0.6, 0.3, 1] } }}
          exit={{ scaleX: 1, opacity: 0, transition: { duration: 0.25, ease: 'easeOut' } }}
          aria-hidden
        />
      )}
    </AnimatePresence>
  );
}
