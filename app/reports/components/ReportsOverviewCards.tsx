'use client';

import { Card, Typography, theme } from 'antd';
import {
  MessageOutlined,
  DatabaseOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  PercentageOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { memo, type ReactNode } from 'react';
import {
  percentChange,
  type FunnelStepKey,
  type LeadFunnelMetrics,
} from '@/lib/utils/lead-funnel';
import styles from './ReportsOverviewCards.module.css';

const { Text } = Typography;

type Props = {
  funnel: LeadFunnelMetrics;
  previousFunnel?: LeadFunnelMetrics | null;
  loading?: boolean;
};

type StepMeta = {
  key: FunnelStepKey;
  shortLabel: string;
  icon: ReactNode;
  color: string;
};

const STEP_META: StepMeta[] = [
  { key: 'messages', shortLabel: 'Nhắn tin', icon: <MessageOutlined />, color: '#14b8a6' },
  { key: 'data', shortLabel: 'Data', icon: <DatabaseOutlined />, color: '#EC008C' },
  { key: 'appointments', shortLabel: 'Lịch hẹn', icon: <CalendarOutlined />, color: '#8b5cf6' },
  { key: 'success', shortLabel: 'Thành công', icon: <CheckCircleOutlined />, color: '#10b981' },
];

type OverviewItem = {
  key: string;
  index?: number;
  label: string;
  valueLabel: string;
  deltaPct: number | null;
  icon: ReactNode;
  color: string;
};

function TrendLine({ deltaPct }: { deltaPct: number | null }) {
  if (deltaPct == null) {
    return (
      <Text type="secondary" style={{ fontSize: 12 }}>
        —
      </Text>
    );
  }
  const up = deltaPct >= 0;
  return (
    <Text style={{ fontSize: 12, fontWeight: 600, color: up ? '#16a34a' : '#dc2626' }}>
      {up ? <ArrowUpOutlined /> : <ArrowDownOutlined />}{' '}
      {Math.abs(deltaPct).toLocaleString('vi-VN')}%
    </Text>
  );
}

function buildOverviewItems(
  funnel: LeadFunnelMetrics,
  previousFunnel?: LeadFunnelMetrics | null,
): OverviewItem[] {
  const prevByKey = new Map(
    (previousFunnel?.steps ?? []).map((s) => [s.key, s.value]),
  );

  const steps: OverviewItem[] = STEP_META.map((meta, index) => {
    const value = funnel.steps.find((s) => s.key === meta.key)?.value ?? 0;
    const prev = prevByKey.get(meta.key) ?? 0;
    return {
      key: meta.key,
      index: index + 1,
      label: meta.shortLabel,
      valueLabel: value.toLocaleString('vi-VN'),
      deltaPct: previousFunnel ? percentChange(value, prev) : null,
      icon: meta.icon,
      color: meta.color,
    };
  });

  steps.push({
    key: 'conversion',
    label: 'Tỷ lệ chuyển đổi',
    valueLabel: `${funnel.overallConversionRate.toLocaleString('vi-VN')}%`,
    deltaPct: previousFunnel
      ? percentChange(
          funnel.overallConversionRate,
          previousFunnel.overallConversionRate,
        )
      : null,
    icon: <PercentageOutlined />,
    color: '#16a34a',
  });

  return steps;
}

function DesktopStepCard({
  item,
  loading,
}: {
  item: OverviewItem;
  loading?: boolean;
}) {
  const { token } = theme.useToken();

  return (
    <Card
      size="small"
      loading={loading}
      styles={{ body: { padding: '12px 14px', minHeight: 104 } }}
      style={{
        borderRadius: 14,
        height: '100%',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        borderColor: token.colorBorderSecondary,
      }}
    >
      {loading ? null : (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: item.color,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: 16,
            }}
          >
            {item.icon}
          </div>
          <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
            <Text
              type="secondary"
              style={{
                fontSize: 12,
                fontWeight: 500,
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.index != null ? `${item.index}. ${item.label}` : item.label}
            </Text>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                lineHeight: 1.25,
                marginTop: 2,
                color: token.colorText,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.valueLabel}
            </div>
            <div style={{ marginTop: 4 }}>
              <TrendLine deltaPct={item.deltaPct} />
            </div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              So với kỳ trước
            </Text>
          </div>
        </div>
      )}
    </Card>
  );
}

function MobileStepCard({ item }: { item: OverviewItem }) {
  const { token } = theme.useToken();

  return (
    <Card
      size="small"
      className={styles.mobileCard}
      style={{ borderColor: token.colorBorderSecondary }}
    >
      <div className={styles.mobileRow}>
        <div className={styles.mobileIcon} style={{ background: item.color }}>
          {item.icon}
        </div>
        <div className={styles.mobileMain}>
          <div
            className={styles.mobileLabel}
            style={{ color: token.colorTextSecondary }}
          >
            {item.index != null ? `${item.index}. ${item.label}` : item.label}
          </div>
          <div className={styles.mobileValue} style={{ color: token.colorText }}>
            {item.valueLabel}
          </div>
        </div>
        <div className={styles.mobileTrend}>
          <TrendLine deltaPct={item.deltaPct} />
          <Text type="secondary" style={{ fontSize: 10 }}>
            so kỳ trước
          </Text>
        </div>
      </div>
    </Card>
  );
}

export const ReportsOverviewCards = memo(function ReportsOverviewCards({
  funnel,
  previousFunnel,
  loading,
}: Props) {
  const items = buildOverviewItems(funnel, previousFunnel);

  return (
    <>
      <div className={styles.mobile}>
        {loading
          ? [0, 1, 2, 3, 4].map((i) => <div key={i} className={styles.skeleton} />)
          : items.map((item) => <MobileStepCard key={item.key} item={item} />)}
      </div>

      <div className={styles.desktop}>
        <div className={styles.desktopGrid}>
          {items.map((item) => (
            <div key={item.key} className={styles.desktopItem}>
              <div className={styles.desktopCardWrap}>
                <DesktopStepCard item={item} loading={loading} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
});
