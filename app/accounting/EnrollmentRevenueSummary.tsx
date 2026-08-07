'use client';

import { Alert, Card, Skeleton, Tag, Typography } from 'antd';
import { memo } from 'react';
import { EnrollmentStatus } from '@/constants/enums';
import { EnrollmentStatusConfig } from '@/constants/enrollment';
import { useEnrollmentRevenue } from '@/lib/hooks/use-enrollments';
import { formatCurrencyVnd } from '@/lib/utils/numberFormat';
import styles from './EnrollmentRevenueSummary.module.css';

const { Title, Text } = Typography;

type Props = {
  startDate: string;
  endDate: string;
  periodLabel?: string;
};

function StatTile({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className={styles.tile}>
      <Text type="secondary" className={styles.tileLabel}>
        {label}
      </Text>
      <div className={styles.tileValue} style={danger ? { color: '#cf1322' } : undefined}>
        {value}
      </div>
    </div>
  );
}

export const EnrollmentRevenueSummary = memo(function EnrollmentRevenueSummary({
  startDate,
  endDate,
  periodLabel,
}: Props) {
  const { data, isLoading, isError, error } = useEnrollmentRevenue(startDate, endDate);

  return (
    <Card style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 16 }} styles={{ body: { padding: 20 } }}>
      <Title level={5} style={{ marginTop: 0, marginBottom: 4 }}>
        Doanh thu đăng ký khóa học
      </Title>
      {periodLabel && (
        <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 12 }}>
          {periodLabel}
        </Text>
      )}

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : isError ? (
        <Alert
          type="error"
          showIcon
          message="Không tải được doanh thu đăng ký"
          description={(error as Error)?.message || 'Vui lòng thử lại sau.'}
        />
      ) : !data || data.totalEnrollments === 0 ? (
        <Text type="secondary">Không có đăng ký nào trong kỳ đã chọn</Text>
      ) : (
        <>
          <div className={styles.tiles}>
            <StatTile label="Số đăng ký" value={data.totalEnrollments.toLocaleString('vi-VN')} />
            <StatTile label="Tổng học phí" value={formatCurrencyVnd(data.totalTuitionFee)} />
            <StatTile label="Đã thu" value={formatCurrencyVnd(data.totalPaid)} />
            <StatTile label="Còn nợ" value={formatCurrencyVnd(data.totalDebt)} danger={data.totalDebt > 0} />
          </div>

          <div className={styles.breakdownRow}>
            <div className={styles.breakdownCol}>
              <Text type="secondary" className={styles.breakdownTitle}>
                Theo trạng thái
              </Text>
              <div className={styles.tagList}>
                {data.byStatus.map((item) => {
                  const cfg = EnrollmentStatusConfig[item.status as EnrollmentStatus];
                  return (
                    <Tag key={item.status} color={cfg?.color ?? 'default'}>
                      {cfg?.label ?? item.status}: {item.count}
                    </Tag>
                  );
                })}
              </div>
            </div>

            <div className={styles.breakdownCol}>
              <Text type="secondary" className={styles.breakdownTitle}>
                Theo nguồn
              </Text>
              <div className={styles.tagList}>
                {data.bySource.map((item) => (
                  <Tag key={item.source}>
                    {item.source}: {item.count} · {formatCurrencyVnd(item.tuitionFee)}
                  </Tag>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  );
});
