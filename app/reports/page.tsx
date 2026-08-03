'use client';

import { useEffect, useMemo, useState } from 'react';
import { App, Card, Space, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { DateFormat } from '@/constants/enums';
import { useAuthPermission } from '@/lib/hooks/use-auth-permission';
import { useLeadStatistics } from '@/lib/hooks/use-lead-statistics';
import { useLeadStatisticsSummary } from '@/lib/hooks/use-lead-statistics-summary';
import { useSmaxTagStatistics } from '@/lib/hooks/use-smax-tag-statistics';
import { LeadStatisticsFilters } from '@/app/lead/components/LeadStatisticsFilters';
import { previousPeriodOfSameLength } from '@/lib/utils/vn-date';
import { ReportsOverviewCards } from './components/ReportsOverviewCards';
import { ReportsDailyTable } from './components/ReportsDailyTable';
import { ReportsCustomerTags } from './components/ReportsCustomerTags';
import styles from './page.module.css';

const { Title, Text } = Typography;

type DateRange = [Dayjs | null, Dayjs | null] | null;

function normalizeRange(next: DateRange): DateRange {
  if (!next?.[0] || !next?.[1]) return next;
  return next[1].isBefore(next[0], 'day') ? [next[1], next[0]] : next;
}

export default function ReportsPage() {
  const { message } = App.useApp();
  const { hasPermission: isAdmin } = useAuthPermission(['ADMIN']);
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

  const { chartData, funnel } = useLeadStatisticsSummary(data);
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
          <LeadStatisticsFilters
            dateRange={dateRange}
            onDateRangeChange={(range) => setDateRange(normalizeRange(range))}
            showTitle={false}
          />
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

        <ReportsDailyTable
          chartData={chartData}
          isAdmin={isAdmin}
          isLoading={isLoading}
        />

        <ReportsCustomerTags
          tags={tagData?.tags ?? []}
          startDate={startDate}
          endDate={endDate}
          isLoading={isTagsLoading}
        />
      </Space>
    </div>
  );
}
