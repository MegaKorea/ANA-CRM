'use client';

import { useEffect, useMemo, useState } from 'react';
import { App, Card, Space, Spin, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import dynamic from 'next/dynamic';
import { DateFormat } from '@/constants/enums';
import { useEnrollmentRevenue } from '@/lib/hooks/use-enrollments';
import { useLeadStatistics } from '@/lib/hooks/use-lead-statistics';
import { useLeadStatisticsSummary } from '@/lib/hooks/use-lead-statistics-summary';
import { useSmaxTagStatistics } from '@/lib/hooks/use-smax-tag-statistics';
import { useSmaxSupporterStatistics } from '@/lib/hooks/use-smax-supporter-statistics';
import { LeadStatisticsFilters } from '@/app/lead/components/LeadStatisticsFilters';
import { previousPeriodOfSameLength } from '@/lib/utils/vn-date';
import { ReportsOverviewCards } from './components/ReportsOverviewCards';
import styles from './page.module.css';

const cardFallback = (
  <Card style={{ borderRadius: 12, minHeight: 160 }}>
    <Spin />
  </Card>
);

const ReportsMessagingPerformance = dynamic(
  () =>
    import('./components/ReportsMessagingPerformance').then(
      (m) => m.ReportsMessagingPerformance,
    ),
  { ssr: false, loading: () => cardFallback },
);
const ReportsConversionStats = dynamic(
  () => import('./components/ReportsConversionStats').then((m) => m.ReportsConversionStats),
  { ssr: false, loading: () => cardFallback },
);
const ReportsCustomerTags = dynamic(
  () => import('./components/ReportsCustomerTags').then((m) => m.ReportsCustomerTags),
  { ssr: false, loading: () => cardFallback },
);
const ReportsUpcomingAppointments = dynamic(
  () => import('./components/ReportsUpcomingAppointments').then((m) => m.ReportsUpcomingAppointments),
  { ssr: false, loading: () => cardFallback },
);
const ReportsSupportersTable = dynamic(
  () => import('./components/ReportsSupportersTable').then((m) => m.ReportsSupportersTable),
  { ssr: false, loading: () => cardFallback },
);
const TeamSalesExportButton = dynamic(
  () => import('./components/TeamSalesExportButton').then((m) => m.TeamSalesExportButton),
  { ssr: false },
);

const { Title, Text } = Typography;

type DateRange = [Dayjs | null, Dayjs | null] | null;

function normalizeRange(next: DateRange): DateRange {
  if (!next?.[0] || !next?.[1]) return next;
  return next[1].isBefore(next[0], 'day') ? [next[1], next[0]] : next;
}

export default function ReportsPage() {
  const { message } = App.useApp();
  const [dateRange, setDateRange] = useState<DateRange>([dayjs(), dayjs()]);

  const startDate = dateRange?.[0]?.format(DateFormat.ISO_DATE) || '';
  const endDate = dateRange?.[1]?.format(DateFormat.ISO_DATE) || '';

  const prevRange = useMemo(() => {
    if (!startDate || !endDate) return { startDate: '', endDate: '' };
    return previousPeriodOfSameLength(startDate, endDate);
  }, [startDate, endDate]);

  const { data, isLoading, isError, error } = useLeadStatistics(startDate, endDate);
  const { data: prevData, isSuccess: isPrevSuccess } = useLeadStatistics(
    prevRange.startDate,
    prevRange.endDate,
  );
  const {
    data: tagData,
    isLoading: isTagsLoading,
    isError: isTagsError,
    error: tagsError,
  } = useSmaxTagStatistics(startDate, endDate);
  const {
    data: supporterData,
    isLoading: isSupportersLoading,
    isError: isSupportersError,
    error: supportersError,
  } = useSmaxSupporterStatistics(startDate, endDate);

  useEffect(() => {
    if (isError) {
      message.error((error as Error).message || 'Lỗi khi lấy dữ liệu báo cáo');
    }
  }, [isError, error, message]);

  useEffect(() => {
    if (isTagsError) {
      message.error((tagsError as Error).message || 'Lỗi khi lấy thống kê tag SMAX');
    }
  }, [isTagsError, tagsError, message]);

  useEffect(() => {
    if (isSupportersError) {
      message.error(
        (supportersError as Error).message || 'Lỗi khi lấy thống kê nhân viên SMAX',
      );
    }
  }, [isSupportersError, supportersError, message]);

  const { data: revenueData, isLoading: isRevenueLoading } = useEnrollmentRevenue(
    startDate,
    endDate,
  );

  const { funnel, totalLeads, totalAppointments, totalNurturing, fbTotalSpend } =
    useLeadStatisticsSummary(data);
  const { funnel: previousFunnel } = useLeadStatisticsSummary(prevData);

  return (  
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <Title level={3} className={styles.headerTitle}>
            Báo cáo
          </Title>
          <Text type="secondary" className={styles.headerSub}>
            Dashboard chuyển đổi Data
          </Text>
        </div>
        <div className={styles.filtersWrap}>
          <Space wrap>
            <LeadStatisticsFilters
              dateRange={dateRange}
              onDateRangeChange={(range) => setDateRange(normalizeRange(range))}
              showTitle={false}
            />
            <TeamSalesExportButton />
          </Space>
        </div>
      </header>

      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <Card className={styles.overviewCard} style={{ borderRadius: 12, overflow: 'hidden' }}>
          <Title level={5} className={styles.sectionTitleMobile} style={{ margin: 0, fontSize: 15 }}>
            Tổng quan chuyển đổi
          </Title>
          <Title level={5} className={styles.sectionTitleDesktop}>
            Tổng quan chuyển đổi
          </Title>
          <ReportsOverviewCards
            funnel={funnel}
            previousFunnel={isPrevSuccess ? previousFunnel : null}
            loading={isLoading}
          />
        </Card>

        <ReportsConversionStats
          totalLeads={totalLeads}
          totalAppointments={totalAppointments}
          totalNurturing={totalNurturing}
          revenue={revenueData?.totalPaid ?? 0}
          fbSpend={fbTotalSpend}
          loading={isLoading || isRevenueLoading}
        />

        {/* ponytail: Bảng thống kê theo ngày tạm ẩn — bỏ comment để bật lại */}

        <div className={styles.splitRow}>
          <div className={styles.halfCol}>
            <ReportsMessagingPerformance
              startDate={startDate}
              endDate={endDate}
              prevStartDate={prevRange.startDate}
              prevEndDate={prevRange.endDate}
            />
          </div>
          <div className={styles.halfCol}>
            <ReportsUpcomingAppointments />
          </div>
          <div className={styles.halfCol}>
            <ReportsSupportersTable
              rows={supporterData?.rows ?? []}
              isLoading={isSupportersLoading}
              isError={isSupportersError}
              errorMessage={(supportersError as Error | undefined)?.message}
            />
          </div>
        </div>

        <ReportsCustomerTags
          tags={tagData?.tags ?? []}
          totalNet={tagData?.totalNet ?? 0}
          startDate={startDate}
          endDate={endDate}
          isLoading={isTagsLoading}
          isError={isTagsError}
          errorMessage={(tagsError as Error | undefined)?.message}
        />
      </Space>
    </div>
  );
}
