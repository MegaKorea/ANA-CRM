import { Card, Col, Row, Divider, Typography, theme } from 'antd';
import dayjs from 'dayjs';
import { memo } from 'react';
import type { LeadStatisticsChartRow } from '@/lib/hooks/use-lead-statistics';
import { formatCurrencyVnd } from '@/lib/utils/numberFormat';

const { Title } = Typography;

interface LeadStatisticsDayCardProps {
  item: LeadStatisticsChartRow;
  isAdmin: boolean;
}

export const LeadStatisticsDayCard = memo(function LeadStatisticsDayCard({
  item,
  isAdmin,
}: LeadStatisticsDayCardProps) {
  const { token } = theme.useToken();

  return (
    <Card size="small" style={{ width: '100%', borderColor: token.colorBorder, borderRadius: 8 }}>
      <Title
        level={5}
        style={{
          margin: 0,
          paddingBottom: 8,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        {dayjs(item.date).format('DD/MM/YYYY')}
      </Title>

      <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
        {isAdmin && (
          <Col span={12}>
            <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>Chi tiêu</div>
            <div style={{ fontWeight: 'bold', color: token.colorPrimaryText }}>
              {formatCurrencyVnd(item.fbSpend || 0)}
            </div>
          </Col>
        )}
        <Col span={12}>
          <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>Tương tác</div>
          <div style={{ fontWeight: 'bold' }}>{item.fbMessages}</div>
        </Col>
      </Row>

      <Divider style={{ margin: '8px 0' }} />

      <Row gutter={[8, 8]}>
        <Col span={12}>
          <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>Data</div>
          <div style={{ fontWeight: 500 }}>{item.totalLeads}</div>
        </Col>
        <Col span={12}>
          <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>Đăng ký</div>
          <div style={{ fontWeight: 500 }}>{item.registeredLeads}</div>
        </Col>
        <Col span={12}>
          <div style={{ color: token.colorTextSecondary, fontSize: 12 }}>
            Lịch hẹn / Khách đến
          </div>
          <div style={{ fontWeight: 500 }}>
            {item.totalAppointments} /{' '}
            <span style={{ color: token.colorSuccessText }}>{item.arrivedAppointments}</span>
          </div>
        </Col>
      </Row>
    </Card>
  );
});
