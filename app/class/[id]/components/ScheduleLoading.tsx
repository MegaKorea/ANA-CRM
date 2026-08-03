'use client';

import { Spin, Typography } from 'antd';
import styles from './tab-schedule.module.scss';

type Props = {
  tip: string;
  /** `large` for full-tab load; default for inline panels / modals */
  size?: 'default' | 'large';
};

export function ScheduleLoading({ tip, size = 'default' }: Props) {
  const isLarge = size === 'large';

  return (
    <div className={isLarge ? styles.stateBlockLarge : styles.panelLoading}>
      <Spin size={isLarge ? 'large' : 'default'} />
      <Typography.Text type="secondary" className={styles.stateHint}>
        {tip}
      </Typography.Text>
    </div>
  );
}
