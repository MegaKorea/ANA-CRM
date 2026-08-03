'use client';

import { Card, Col, Row, Space, Tag, Typography, theme } from 'antd';
import {
  CheckCircleOutlined,
  CalendarOutlined,
  DatabaseOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import type { FunnelStep, LeadFunnelMetrics } from '@/lib/utils/lead-funnel';

const { Text, Title } = Typography;

const STEP_ICON = {
  messages: <MessageOutlined />,
  data: <DatabaseOutlined />,
  appointments: <CalendarOutlined />,
  success: <CheckCircleOutlined />,
} as const;

const SOURCE_LABEL = {
  smax: 'SMAX',
  crm: 'CRM',
  facebook: 'Meta Ads',
  mixed: 'Kết hợp',
} as const;

type Props = {
  funnel: LeadFunnelMetrics;
  loading?: boolean;
};

function formatRate(rate: number | null): string {
  if (rate == null) return '—';
  return `${rate}%`;
}

function FunnelBar({
  step,
  maxValue,
  color,
}: {
  step: FunnelStep;
  maxValue: number;
  color: string;
}) {
  const widthPct =
    maxValue > 0 ? Math.max(12, Math.round((step.value / maxValue) * 100)) : 12;

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 6,
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <Space size={8} wrap>
          {STEP_ICON[step.key]}
          <Text strong>{step.label}</Text>
          <Tag style={{ marginInlineEnd: 0 }}>{SOURCE_LABEL[step.source]}</Tag>
        </Space>
        <Space size={12}>
          <Text strong style={{ fontSize: 16 }}>
            {step.value.toLocaleString('vi-VN')}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {step.key === 'messages'
              ? 'Đầu phễu'
              : `CVR ${formatRate(step.rateFromPrevious)}`}
          </Text>
        </Space>
      </div>
      <div
        style={{
          height: 28,
          borderRadius: 8,
          background: 'var(--neutral-100, #f1f2f6)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${widthPct}%`,
            height: '100%',
            borderRadius: 8,
            background: color,
            transition: 'width 0.35s ease',
            margin: '0 auto',
          }}
        />
      </div>
    </div>
  );
}

export function LeadFunnelChart({ funnel, loading }: Props) {
  const { token } = theme.useToken();
  const maxValue = Math.max(...funnel.steps.map((s) => s.value), 1);

  const colors = [
    token.colorWarning,
    token.colorInfo,
    token.colorPrimary,
    token.colorSuccess,
  ];

  return (
    <Card style={{ marginBottom: 24, borderRadius: 12 }} loading={loading}>
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: 16 }}
        gutter={[12, 12]}
      >
        <Col>
          <Title level={5} style={{ margin: 0 }}>
            Phễu chuyển đổi
          </Title>
          <Text type="secondary">
            Khách nhắn tin → Data → Đặt lịch hẹn → Thành công
          </Text>
        </Col>
        <Col>
          <Space orientation="vertical" size={0} style={{ textAlign: 'right' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Tỷ lệ chuyển đổi tổng thể
            </Text>
            <Text strong style={{ fontSize: 22, color: token.colorSuccess }}>
              {formatRate(funnel.overallConversionRate)}
            </Text>
          </Space>
        </Col>
      </Row>

      {funnel.steps.map((step, index) => (
        <FunnelBar
          key={step.key}
          step={step}
          maxValue={maxValue}
          color={colors[index] ?? token.colorPrimary}
        />
      ))}
    </Card>
  );
}
