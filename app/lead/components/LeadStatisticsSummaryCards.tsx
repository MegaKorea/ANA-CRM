import { Row, Col, Card, Statistic, theme } from 'antd';
import { UserOutlined, FacebookOutlined, DatabaseOutlined } from '@ant-design/icons';
import { memo } from 'react';
import { formatCurrencyVnd } from '@/lib/utils/numberFormat';

interface LeadStatisticsSummaryCardsProps {
  isAdmin: boolean;
  fbTotalSpend: number;
  fbTotalMessages: number;
  totalLeads: number;
}

export const LeadStatisticsSummaryCards = memo(function LeadStatisticsSummaryCards({
  isAdmin,
  fbTotalSpend,
  fbTotalMessages,
  totalLeads,
}: LeadStatisticsSummaryCardsProps) {
  const { token } = theme.useToken();

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      {isAdmin && (
        <Col xs={24} sm={12} md={8}>
          <Card
            size="small"
            style={{
              borderColor: token.colorPrimaryBorder,
              backgroundColor: token.colorPrimaryBg,
              borderRadius: 12,
            }}
          >
            <Statistic
              title="Chi Tiêu"
              value={fbTotalSpend}
              formatter={(v) => formatCurrencyVnd(Number(v))}
              prefix={<FacebookOutlined />}
              styles={{ content: { color: token.colorPrimaryText, fontWeight: 'bold' } }}
            />
          </Card>
        </Col>
      )}
      <Col xs={24} sm={12} md={isAdmin ? 8 : 12}>
        <Card
          size="small"
          style={{
            borderColor: token.colorWarningBorder,
            backgroundColor: token.colorWarningBg,
            borderRadius: 12,
          }}
        >
          <Statistic
            title="Tương Tác"
            value={fbTotalMessages}
            prefix={<UserOutlined />}
            styles={{ content: { color: token.colorWarningText, fontWeight: 'bold' } }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={isAdmin ? 8 : 12}>
        <Card
          size="small"
          style={{
            borderColor: token.colorSuccessBorder,
            backgroundColor: token.colorSuccessBg,
            borderRadius: 12,
          }}
        >
          <Statistic
            title="Tổng Data"
            value={totalLeads}
            prefix={<DatabaseOutlined />}
            styles={{ content: { color: token.colorSuccessText, fontWeight: 'bold' } }}
          />
        </Card>
      </Col>
    </Row>
  );
});
