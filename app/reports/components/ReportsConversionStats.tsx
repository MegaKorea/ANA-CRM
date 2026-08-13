'use client';

import { Card, Typography, theme } from 'antd';
import {
  TeamOutlined,
  CalendarOutlined,
  HeartOutlined,
  DollarOutlined,
  FundOutlined,
} from '@ant-design/icons';
import { memo, type ReactNode } from 'react';
import { formatCurrencyVnd } from '@/lib/utils/numberFormat';
import styles from './ReportsConversionStats.module.css';

const { Text } = Typography;

type Props = {
  totalLeads: number;
  totalAppointments: number;
  totalNurturing: number;
  revenue: number;
  fbSpend: number;
  loading?: boolean;
};

type StatItem = {
  key: string;
  label: string;
  valueLabel: string;
  hint: string;
  icon: ReactNode;
  color: string;
};

function buildStats({
  totalLeads,
  totalAppointments,
  totalNurturing,
  revenue,
  fbSpend,
}: Omit<Props, 'loading'>): StatItem[] {
  const costPerLead = totalLeads > 0 ? fbSpend / totalLeads : 0;

  return [
    {
      key: 'customers',
      label: 'Khách hàng',
      valueLabel: totalLeads.toLocaleString('vi-VN'),
      hint: 'Data nhận trong kỳ',
      icon: <TeamOutlined />,
      color: '#EC008C',
    },
    {
      key: 'appointments',
      label: 'Lịch hẹn',
      valueLabel: totalAppointments.toLocaleString('vi-VN'),
      hint: 'Lịch hẹn trong kỳ',
      icon: <CalendarOutlined />,
      color: '#8b5cf6',
    },
    {
      key: 'nurturing',
      label: 'Chăm sóc',
      valueLabel: totalNurturing.toLocaleString('vi-VN'),
      hint: 'Đang chăm sóc',
      icon: <HeartOutlined />,
      color: '#f59e0b',
    },
    {
      key: 'revenue',
      label: 'Doanh số',
      valueLabel: formatCurrencyVnd(revenue),
      hint: 'Đã thu (kế toán)',
      icon: <DollarOutlined />,
      color: '#10b981',
    },
    {
      key: 'mkt',
      label: 'Hiệu quả MKT',
      valueLabel: totalLeads > 0 ? formatCurrencyVnd(costPerLead) : '—',
      hint: `Chi phí / 1 khách hàng · Chi phí ${formatCurrencyVnd(fbSpend)}`,
      icon: <FundOutlined />,
      color: '#0ea5e9',
    },
  ];
}

export const ReportsConversionStats = memo(function ReportsConversionStats({
  loading,
  ...values
}: Props) {
  const { token } = theme.useToken();

  if (loading) {
    return (
      <div className={styles.grid}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.skeleton} />
        ))}
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {buildStats(values).map((item) => (
        <Card
          key={item.key}
          size="small"
          className={styles.card}
          style={{ borderColor: token.colorBorderSecondary }}
        >
          <div className={styles.head}>
            <Text type="secondary" className={styles.label}>
              {item.label}
            </Text>
            <div
              className={styles.icon}
              style={{ background: `${item.color}1f`, color: item.color }}
            >
              {item.icon}
            </div>
          </div>
          <div className={styles.value} style={{ color: token.colorText }}>
            {item.valueLabel}
          </div>
          <Text type="secondary" className={styles.hint}>
            {item.hint}
          </Text>
        </Card>
      ))}
    </div>
  );
});
