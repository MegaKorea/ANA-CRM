import type { ReactNode } from 'react';
import { Card, Col, Row, Space, Typography } from 'antd';
import { DollarOutlined, ExclamationCircleOutlined, TeamOutlined } from '@ant-design/icons';
import { formatNumberVi } from '@/lib/utils/numberFormat';

type Props = {
  enrollmentCount: number;
  debtTotal: number;
  revenueTotal: number;
};

function StatTile({
  icon,
  color,
  label,
  value,
}: {
  icon: ReactNode;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <Card size="small" style={{ borderRadius: 12 }} styles={{ body: { padding: '14px 16px' } }}>
      <Space size={12} align="center">
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: 18,
            color,
            background: `${color}1f`,
          }}
        >
          {icon}
        </span>
        <Space orientation="vertical" size={0}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {label}
          </Typography.Text>
          <Typography.Text strong style={{ fontSize: 18, whiteSpace: 'nowrap' }}>
            {value}
          </Typography.Text>
        </Space>
      </Space>
    </Card>
  );
}

export function PaymentStatsCards({ enrollmentCount, debtTotal, revenueTotal }: Props) {
  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} lg={8}>
        <StatTile
          icon={<TeamOutlined />}
          color="#1890ff"
          label="Học viên đã đăng ký"
          value={formatNumberVi(enrollmentCount)}
        />
      </Col>
      <Col xs={24} sm={12} lg={8}>
        <StatTile
          icon={<DollarOutlined />}
          color="#52c41a"
          label="Doanh thu"
          value={`${formatNumberVi(revenueTotal)} đ`}
        />
      </Col>
      <Col xs={24} sm={12} lg={8}>
        <StatTile
          icon={<ExclamationCircleOutlined />}
          color="#cf1322"
          label="Còn nợ"
          value={`${formatNumberVi(debtTotal)} đ`}
        />
      </Col>
    </Row>
  );
}
