import { Row, Col, Card, Statistic } from 'antd';
import { memo } from 'react';
import dayjs, { type Dayjs } from 'dayjs';
import { useLeads } from '@/lib/hooks/use-leads';
import { useAppointmentsInRange } from '@/lib/hooks/use-appointments';
import { useLeadStatistics } from '@/lib/hooks/use-lead-statistics';
import { LeadStatus, DateFormat } from '@/constants/enums';

interface SummaryCardProps {
  title: string;
  value: number | string;
  loading?: boolean;
}

function SummaryCard({ title, value, loading }: SummaryCardProps) {
  return (
    <Card size="small" style={{ height: '100%', borderRadius: 12 }}>
      <Statistic title={title} value={value} loading={loading} />
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

  const rangeStart = (startDate ?? endDate) as string;
  const rangeEnd = (endDate ?? startDate) as string;

  // "Nhắn tin" here is SMAX's new-customer count (customer_new_total).
  const { data: statistics, isLoading: isLoadingMessages } = useLeadStatistics(
    rangeStart,
    rangeEnd,
  );
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
    rangeStart,
    rangeEnd,
  );

  return (
    <Row gutter={[16, 16]} className="mb-section">
      <Col xs={12} md={6}>
        <SummaryCard
          title="Nhắn tin"
          value={statistics?.smaxNewCustomers ?? 0}
          loading={isLoadingMessages}
        />
      </Col>
      <Col xs={12} md={6}>
        <SummaryCard
          title="Data"
          value={allLeads?.total ?? 0}
          loading={isLoadingAll}
        />
      </Col>
      <Col xs={12} md={6}>
        <SummaryCard
          title="Đang chăm sóc"
          value={nurturingLeads?.total ?? 0}
          loading={isLoadingNurturing}
        />
      </Col>
      <Col xs={12} md={6}>
        <SummaryCard
          title="Lịch hẹn"
          value={appointments?.length ?? 0}
          loading={isLoadingAppointments}
        />
      </Col>
    </Row>
  );
});
