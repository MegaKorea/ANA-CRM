'use client';

import { Card, Row, Col, Statistic, Table, Tag, Typography, Space } from 'antd';
import {
  UserOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  RiseOutlined,
  TeamOutlined,
} from '@ant-design/icons';

const { Title } = Typography;

// Sample data for dashboard
const recentOrders = [
  {
    key: '1',
    orderId: 'ORD-001',
    customer: 'Nguyễn Văn A',
    amount: 2500000,
    status: 'completed',
    date: '2024-01-20',
  },
  {
    key: '2',
    orderId: 'ORD-002',
    customer: 'Trần Thị B',
    amount: 1800000,
    status: 'processing',
    date: '2024-01-20',
  },
  {
    key: '3',
    orderId: 'ORD-003',
    customer: 'Lê Văn C',
    amount: 3200000,
    status: 'pending',
    date: '2024-01-19',
  },
  {
    key: '4',
    orderId: 'ORD-004',
    customer: 'Phạm Thị D',
    amount: 950000,
    status: 'completed',
    date: '2024-01-19',
  },
];

const columns = [
  {
    title: 'Mã đơn hàng',
    dataIndex: 'orderId',
    key: 'orderId',
  },
  {
    title: 'Khách hàng',
    dataIndex: 'customer',
    key: 'customer',
  },
  {
    title: 'Số tiền',
    dataIndex: 'amount',
    key: 'amount',
    render: (value: number) =>
      new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value),
  },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => {
      const colors: Record<string, string> = {
        completed: 'green',
        processing: 'blue',
        pending: 'orange',
      };
      const labels: Record<string, string> = {
        completed: 'Hoàn thành',
        processing: 'Đang xử lý',
        pending: 'Chờ xử lý',
      };
      return <Tag color={colors[status]}>{labels[status]}</Tag>;
    },
  },
  {
    title: 'Ngày',
    dataIndex: 'date',
    key: 'date',
  },
];

export default function DashboardPage() {
  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={4} style={{ margin: 0 }}>
        Dashboard
      </Title>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="Tổng khách hàng"
              value={1234}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="Đơn hàng mới"
              value={56}
              prefix={<ShoppingCartOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="Doanh thu tháng"
              value={156000000}
              prefix={<DollarOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
              formatter={(value) =>
                new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                  maximumFractionDigits: 0,
                }).format(value as number)
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8 }}>
            <Statistic
              title="Tăng trưởng"
              value={12.5}
              prefix={<RiseOutlined style={{ color: '#722ed1' }} />}
              suffix="%"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Orders */}
      <Card
        title="Đơn hàng gần đây"
        bordered={false}
        style={{ borderRadius: 8 }}
        extra={<a href="/orders">Xem tất cả</a>}
      >
        <Table
          columns={columns}
          dataSource={recentOrders}
          pagination={false}
          size="middle"
        />
      </Card>
    </Space>
  );
}
