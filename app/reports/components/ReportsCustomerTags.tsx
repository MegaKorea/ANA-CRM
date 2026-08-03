'use client';

import { Card, Empty, Skeleton, Typography } from 'antd';
import dayjs from 'dayjs';
import { memo } from 'react';
import { SMAX_TAGS_TOP } from '@/constants/smax';
import type { SmaxTagTotal } from '@/lib/smax/types';
import styles from './ReportsCustomerTags.module.css';

const { Title, Text } = Typography;

type Props = {
  tags: SmaxTagTotal[];
  startDate: string;
  endDate: string;
  isLoading: boolean;
};

const TAG_COLORS = [
  { bg: '#fce7f3', color: '#be185d' },
  { bg: '#dcfce7', color: '#15803d' },
  { bg: '#ede9fe', color: '#6d28d9' },
  { bg: '#ccfbf1', color: '#0f766e' },
  { bg: '#ffedd5', color: '#c2410c' },
  { bg: '#fee2e2', color: '#b91c1c' },
  { bg: '#e0f2fe', color: '#0369a1' },
  { bg: '#d1fae5', color: '#047857' },
  { bg: '#dbeafe', color: '#1d4ed8' },
  { bg: '#fce7f3', color: '#9d174d' },
] as const;

function formatRange(startDate: string, endDate: string): string | null {
  if (!startDate || !endDate) return null;
  return `${dayjs(startDate).format('DD/MM/YYYY')} → ${dayjs(endDate).format('DD/MM/YYYY')}`;
}

export const ReportsCustomerTags = memo(function ReportsCustomerTags({
  tags,
  startDate,
  endDate,
  isLoading,
}: Props) {
  const rangeLabel = formatRange(startDate, endDate);
  const totalNet = tags.reduce((sum, tag) => sum + tag.net, 0);
  const columnsStyle = {
    gridTemplateColumns: `repeat(${Math.max(tags.length, 1)}, minmax(72px, 1fr))`,
  };

  return (
    <Card style={{ borderRadius: 12, overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
      <div className={styles.body}>
        <div className={styles.header}>
          <Title level={5} className={styles.title}>
            Tag khách hàng
          </Title>
          {rangeLabel ? (
            <Text type="secondary" className={styles.rangeHint}>
              Top {SMAX_TAGS_TOP} · {rangeLabel}
            </Text>
          ) : null}
        </div>

        {isLoading ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : tags.length === 0 ? (
          <Empty description="Không có tag trong kỳ đã chọn" />
        ) : (
          <>
            <Text className={styles.total}>
              Tổng (gắn − gỡ):{' '}
              <span className={styles.totalValue}>{totalNet.toLocaleString('vi-VN')}</span>
            </Text>

            <div className={styles.matrix} role="table" aria-label="Top tag khách hàng">
              <div className={styles.rowLabel}>Trạng thái</div>
              <div className={styles.pills} style={columnsStyle}>
                {tags.map((tag, index) => {
                  const tone = TAG_COLORS[index % TAG_COLORS.length];
                  return (
                    <span
                      key={tag.name}
                      className={styles.pill}
                      style={{ background: tone.bg, color: tone.color }}
                      title={tag.name}
                    >
                      {tag.name}
                    </span>
                  );
                })}
              </div>

              <div className={styles.rowLabel}>Số lượng</div>
              <div className={styles.counts} style={columnsStyle}>
                {tags.map((tag) => (
                  <span
                    key={tag.name}
                    className={tag.net < 0 ? styles.countNeg : styles.count}
                  >
                    {tag.net.toLocaleString('vi-VN')}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
});
