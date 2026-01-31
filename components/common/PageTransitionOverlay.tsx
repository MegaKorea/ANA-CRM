'use client';

import { Spin } from 'antd';
import styles from './PageTransitionOverlay.module.scss';

interface PageTransitionOverlayProps {
  visible: boolean;
}

export function PageTransitionOverlay({ visible }: PageTransitionOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className={styles.overlay}>
      <Spin size="large" />
    </div>
  );
}
