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
import styles from './ReportsOverviewCards.module.css';

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

function StatBody({ item }: { item: StatItem }) {
  const { token } = theme.useToken();

  return (
    <div className={styles.mobileRow}>
      <div className={styles.mobileIcon} style={{ background: item.color }}>
        {item.icon}
      </div>
      <div className={styles.mobileMain}>
        <div className={styles.mobileLabel} style={{ color: token.colorTextSecondary }}>
          {item.label}
        </div>
        <div className={styles.mobileValue} style={{ color: token.colorText }}>
          {item.valueLabel}
        </div>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {item.hint}
        </Text>
      </div>
    </div>
  );
}

export const ReportsConversionStats = memo(function ReportsConversionStats({
  loading,
  ...values
}: Props) {
  const { token } = theme.useToken();
  const items = buildStats(values);

  const card = (item: StatItem) => (
    <Card
      size="small"
      className={styles.mobileCard}
      style={{ borderColor: token.colorBorderSecondary, height: '100%' }}
    >
      <StatBody item={item} />
    </Card>
  );

  return (
    <>
      <div className={styles.mobile}>
        {loading
          ? [0, 1, 2, 3, 4].map((i) => <div key={i} className={styles.skeleton} />)
          : items.map((item) => <div key={item.key}>{card(item)}</div>)}
      </div>

      <div className={styles.desktop}>
        <div className={styles.desktopGrid}>
          {loading
            ? [0, 1, 2, 3, 4].map((i) => <div key={i} className={styles.skeleton} />)
            : items.map((item) => (
                <div key={item.key} className={styles.desktopCardWrap}>
                  {card(item)}
                </div>
              ))}
        </div>
      </div>
    </>
  );
});
