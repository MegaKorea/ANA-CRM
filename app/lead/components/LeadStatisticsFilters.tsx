import { Row, Col, DatePicker, Space, Typography } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { memo } from 'react';

const { RangePicker } = DatePicker;
const { Title } = Typography;

interface LeadStatisticsFiltersProps {
  dateRange: [Dayjs | null, Dayjs | null] | null;
  onDateRangeChange: (range: [Dayjs | null, Dayjs | null] | null) => void;
  isMobile: boolean;
}

export const LeadStatisticsFilters = memo(function LeadStatisticsFilters({
  dateRange,
  onDateRangeChange,
  isMobile,
}: LeadStatisticsFiltersProps) {
  return (
    <Row justify="space-between" align="middle" style={{ marginBottom: 16 }} gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <Title level={4} style={{ margin: 0 }}>
          Thống kê tổng quan
        </Title>
      </Col>
      <Col
        xs={24}
        md={12}
        style={{
          display: 'flex',
          justifyContent: isMobile ? 'flex-start' : 'flex-end',
          width: '100%',
        }}
      >
        <Space
          orientation={isMobile ? 'vertical' : 'horizontal'}
          style={{ width: isMobile ? '100%' : 'auto' }}
        >
          <span style={{ fontWeight: 500 }}>Bộ lọc ngày:</span>
          {!isMobile ? (
            <RangePicker
              value={dateRange}
              onChange={(dates) => onDateRangeChange(dates as [Dayjs | null, Dayjs | null] | null)}
              format="DD/MM/YYYY"
              allowClear={false}
            />
          ) : (
            <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
              <DatePicker
                style={{ flex: 1 }}
                value={dateRange?.[0]}
                onChange={(date) => onDateRangeChange([date, dateRange?.[1] || dayjs()])}
                format="DD/MM/YYYY"
                allowClear={false}
                inputReadOnly={true}
              />
              <span style={{ padding: '0 8px' }}>-</span>
              <DatePicker
                style={{ flex: 1 }}
                value={dateRange?.[1]}
                onChange={(date) => onDateRangeChange([dateRange?.[0] || dayjs(), date])}
                format="DD/MM/YYYY"
                allowClear={false}
                inputReadOnly={true}
              />
            </div>
          )}
        </Space>
      </Col>
    </Row>
  );
});
