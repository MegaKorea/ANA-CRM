'use client';

import { Alert, Card, Empty, Skeleton, Typography } from 'antd';
import dayjs from 'dayjs';
import { memo, type ReactNode } from 'react';
import { SMAX_TAGS_TOP } from '@/constants/smax';
import type { SmaxTagTotal } from '@/lib/smax/types';
import styles from './ReportsCustomerTags.module.css';

const { Title, Text } = Typography;

type Props = {
  tags: SmaxTagTotal[];
  totalNet: number;
  startDate: string;
  endDate: string;
  isLoading: boolean;
  isError?: boolean;
  errorMessage?: string;
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

function formatVi(n: number): string {
  return n.toLocaleString('vi-VN');
}

function formatRange(startDate: string, endDate: string): string | null {
  if (!startDate || !endDate) return null;
  return `${dayjs(startDate).format('DD/MM/YYYY')} → ${dayjs(endDate).format('DD/MM/YYYY')}`;
}

function TagMatrix({ tags }: { tags: SmaxTagTotal[] }) {
  const columnsStyle = {
    gridTemplateColumns: `repeat(${Math.max(tags.length, 1)}, minmax(72px, 1fr))`,
  };

  return (
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
              title={`${tag.name} · gắn ${formatVi(tag.add)} · gỡ ${formatVi(tag.remove)} · hiện tại ${formatVi(tag.curAdd)}`}
            >
              {tag.name}
            </span>
          );
        })}
      </div>

      <div className={styles.rowLabel}>Gắn − gỡ</div>
      <div className={styles.counts} style={columnsStyle}>
        {tags.map((tag) => (
          <span
            key={tag.name}
            className={tag.net < 0 ? styles.countNeg : styles.count}
          >
            {formatVi(tag.net)}
          </span>
        ))}
      </div>
    </div>
  );
}

export const ReportsCustomerTags = memo(function ReportsCustomerTags({
  tags,
  totalNet,
  startDate,
  endDate,
  isLoading,
  isError = false,
  errorMessage,
}: Props) {
  const rangeLabel = formatRange(startDate, endDate);

  let body: ReactNode;
  if (isLoading) {
    body = <Skeleton active paragraph={{ rows: 3 }} />;
  } else if (isError) {
    body = (
      <Alert
        type="error"
        showIcon
        message="Không tải được thống kê tag"
        description={errorMessage || 'Vui lòng thử lại sau.'}
      />
    );
  } else if (tags.length === 0) {
    body = <Empty description="Không có tag trong kỳ đã chọn" />;
  } else {
    body = (
      <>
        <Text className={styles.total}>
          Tổng: <span className={styles.totalValue}>{formatVi(totalNet)}</span>
        </Text>
        <Text type="secondary" className={styles.totalHint}>
          Gắn − gỡ trong kỳ đã chọn
        </Text>
        <TagMatrix tags={tags} />
      </>
    );
  }

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
        {body}
      </div>
    </Card>
  );
});
