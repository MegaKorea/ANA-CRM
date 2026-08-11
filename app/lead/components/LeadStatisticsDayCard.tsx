import { Card, Col, Row, Typography, theme } from 'antd';
import dayjs from 'dayjs';
import { memo } from 'react';
import type { LeadStatisticsChartRow } from '@/lib/hooks/use-lead-statistics';
import { formatCurrencyVnd } from '@/lib/utils/numberFormat';

const { Title } = Typography;

interface LeadStatisticsDayCardProps {
  item: LeadStatisticsChartRow;
  isAdmin?: boolean;
}

export const LeadStatisticsDayCard = memo(function LeadStatisticsDayCard({
  item,
  isAdmin = false,
}: LeadStatisticsDayCardProps) {
  const { token } = theme.useToken();

  return (
    <Card
      size="small"
      style={{
        width: '100%',
        maxWidth: '100%',
        borderColor: token.colorBorder,
        borderRadius: 8,
        overflow: 'hidden',
      }}
      styles={{ body: { padding: 12 } }}
    >
      <Title
        level={5}
        style={{
          margin: 0,
          paddingBottom: 8,
          fontSize: 15,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        {dayjs(item.date).format('DD/MM/YYYY')}
      </Title>

      <Row gutter={[8, 10]} style={{ marginTop: 8 }}>
        {isAdmin ? (
          <Col span={12} style={{ minWidth: 0 }}>
            <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>Chi tiêu</div>
            <div
              style={{
                fontWeight: 'bold',
                color: token.colorPrimaryText,
                wordBreak: 'break-word',
              }}
            >
              {formatCurrencyVnd(item.fbSpend || 0)}
            </div>
          </Col>
        ) : null}
        <Col span={12} style={{ minWidth: 0 }}>
          <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>Tương tác</div>
          <div style={{ fontWeight: 'bold' }}>{item.fbMessages}</div>
        </Col>
        <Col span={12} style={{ minWidth: 0 }}>
          <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>Data</div>
          <div style={{ fontWeight: 500 }}>{item.totalLeads}</div>
        </Col>
        <Col span={12} style={{ minWidth: 0 }}>
          <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>Đăng ký</div>
          <div style={{ fontWeight: 500 }}>{item.registeredLeads}</div>
        </Col>
        <Col span={12} style={{ minWidth: 0 }}>
          <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>Lịch hẹn</div>
          <div style={{ fontWeight: 500 }}>{item.totalAppointments}</div>
        </Col>
        <Col span={12} style={{ minWidth: 0 }}>
          <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>Đến tư vấn</div>
          <div style={{ fontWeight: 500, color: token.colorSuccessText }}>
            {item.arrivedAppointments}
          </div>
        </Col>
      </Row>
    </Card>
  );
});
