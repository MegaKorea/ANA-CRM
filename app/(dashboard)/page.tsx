'use client';

import { Card, Row, Col, Statistic, Typography, Space } from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  RiseOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { formatCurrencyVnd } from '@/lib/utils/numberFormat';

const { Title } = Typography;

export default function DashboardPage() {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={4} style={{ margin: 0 }}>
        Dashboard
      </Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card variant='borderless' style={{ borderRadius: 8 }}>
            <Statistic
              title="Tổng khách hàng"
              value={0}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant='borderless' style={{ borderRadius: 8 }}>
            <Statistic
              title="Đơn hàng mới"
              value={0}
              prefix={<ShoppingCartOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant='borderless' style={{ borderRadius: 8 }}>
            <Statistic
              title="Doanh thu tháng"
              value={0}
              prefix={<DollarOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
              formatter={(value) => formatCurrencyVnd(value as number)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant='borderless' style={{ borderRadius: 8 }}>
            <Statistic
              title="Tăng trưởng"
              value={0}
              prefix={<RiseOutlined style={{ color: '#722ed1' }} />}
              suffix="%"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
