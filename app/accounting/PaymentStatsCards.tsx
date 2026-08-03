import { Badge, Card, Col, Row, Statistic, Typography } from 'antd';
import { DollarOutlined, ExclamationCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import { formatCurrencyVnd, formatNumberVi } from '@/lib/utils/numberFormat';

type Props = {
  total: number;
  pendingCount: number;
  pendingTotal: number;
  approvedTotal: number;
};

export function PaymentStatsCards({ total, pendingCount, pendingTotal, approvedTotal }: Props) {
  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={8}>
        <Card>
          <Statistic
            title="Tổng phiếu trong ngày"
            value={total}
            prefix={<FileTextOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card>
          <Statistic
            title="Chờ duyệt"
            value={pendingCount}
            styles={{ content: { color: '#faad14' } }}
            prefix={
              <Badge count={pendingCount} offset={[-6, 0]} overflowCount={99}>
                <ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 20 }} />
              </Badge>
            }
            suffix={
              pendingTotal > 0 ? (
                <Typography.Text type="secondary" style={{ fontSize: 14 }}>
                  ({formatCurrencyVnd(pendingTotal)})
                </Typography.Text>
              ) : null
            }
          />
        </Card>
      </Col>
      <Col xs={24} sm={8}>
        <Card>
          <Statistic
            title="Đã duyệt"
            value={formatNumberVi(approvedTotal)}
            styles={{ content: { color: '#52c41a' } }}
            prefix={<DollarOutlined />}
            suffix="đ"
          />
        </Card>
      </Col>
    </Row>
  );
}
