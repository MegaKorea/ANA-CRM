import { Row, Col, Card, Statistic } from 'antd';
import {
  DatabaseOutlined,
  HeartOutlined,
  CalendarOutlined,
  HourglassOutlined,
} from '@ant-design/icons';
import { memo, type ReactNode } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { useLeads } from '@/lib/hooks/use-leads';
import { useAppointmentsInRange } from '@/lib/hooks/use-appointments';
import { LeadStatus, DateFormat } from '@/constants/enums';

interface SummaryCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  loading?: boolean;
}

function SummaryCard({ title, value, icon, loading }: SummaryCardProps) {
  return (
    <Card size="small" style={{ height: '100%', borderRadius: 12 }}>
      <Statistic title={title} value={value} loading={loading} prefix={icon} />
    </Card>
  );
}

interface LeadSummaryCardsProps {
  createdAtRange: [Dayjs | null, Dayjs | null] | null;
}

/**
 * Report cards shown above the lead table. Defaults to today; follows the
 * table's created-at filter when one is set, and ignores its other filters.
 */
export const LeadSummaryCards = memo(function LeadSummaryCards({
  createdAtRange,
}: LeadSummaryCardsProps) {
  const hasRange = !!(createdAtRange?.[0] || createdAtRange?.[1]);
  const today = dayjs().format(DateFormat.ISO_DATE);
  const startDate = hasRange ? createdAtRange?.[0]?.format(DateFormat.ISO_DATE) : today;
  const endDate = hasRange ? createdAtRange?.[1]?.format(DateFormat.ISO_DATE) : today;

  // limit: 1 — only the `total` count is needed, not the rows.
  const { data: allLeads, isLoading: isLoadingAll } = useLeads({
    excludeStatus: LeadStatus.CONVERTED,
    startDate,
    endDate,
    page: 1,
    limit: 1,
  });
  const { data: nurturingLeads, isLoading: isLoadingNurturing } = useLeads({
    status: LeadStatus.NURTURING,
    startDate,
    endDate,
    page: 1,
    limit: 1,
  });
  // Appointments are counted by appointment date within the same range.
  const { data: appointments, isLoading: isLoadingAppointments } = useAppointmentsInRange(
    (startDate ?? endDate) as string,
    (endDate ?? startDate) as string,
  );

  return (
    <Row gutter={[16, 16]} className="mb-section">
      <Col xs={12} md={6}>
        <SummaryCard
          title="Data"
          value={allLeads?.total ?? 0}
          icon={<DatabaseOutlined />}
          loading={isLoadingAll}
        />
      </Col>
      <Col xs={12} md={6}>
        <SummaryCard
          title="Đang chăm sóc"
          value={nurturingLeads?.total ?? 0}
          icon={<HeartOutlined />}
          loading={isLoadingNurturing}
        />
      </Col>
      <Col xs={12} md={6}>
        <SummaryCard
          title="Lịch hẹn"
          value={appointments?.length ?? 0}
          icon={<CalendarOutlined />}
          loading={isLoadingAppointments}
        />
      </Col>
      <Col xs={12} md={6}>
        <SummaryCard title="Sắp ra mắt" value="Đang cập nhật" icon={<HourglassOutlined />} />
      </Col>
    </Row>
  );
});
