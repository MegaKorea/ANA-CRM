'use client';

import { Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  AppointmentsWeekCalendar,
  getCalendarRange,
  type CalendarViewMode,
} from '@/components/appointments/AppointmentsWeekCalendar';
import { useAppointmentsInRange } from '@/lib/hooks/use-appointments';
import { startOfWeekMonday, toVnDate } from '@/lib/utils/vn-date';
import styles from './page.module.css';

const { Title, Text } = Typography;

export default function AppointmentsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [anchorDate, setAnchorDate] = useState(() =>
    startOfWeekMonday(toVnDate(new Date().toISOString())),
  );

  const { startDate, endDate } = useMemo(
    () => getCalendarRange(viewMode, anchorDate),
    [viewMode, anchorDate],
  );

  const { data, isLoading, isError, error } = useAppointmentsInRange(
    startDate,
    endDate,
  );

  const handleViewModeChange = (mode: CalendarViewMode) => {
    setViewMode(mode);
    const today = toVnDate(new Date().toISOString());
    setAnchorDate(
      mode === 'week' ? startOfWeekMonday(today) : `${today.slice(0, 7)}-01`,
    );
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <Title level={3} className={styles.headerTitle}>
            Lịch hẹn
          </Title>
          <Text type="secondary" className={styles.headerSub}>
            Lọc theo tuần hoặc tháng · click lịch để mở lead
          </Text>
        </div>
      </header>

      <div className={styles.calendarCard}>
        <AppointmentsWeekCalendar
          title="Lịch hẹn & chăm sóc"
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          anchorDate={anchorDate}
          onAnchorChange={setAnchorDate}
          appointments={data}
          isLoading={isLoading}
          isError={isError}
          errorMessage={(error as Error | undefined)?.message}
          onSelect={(item) => router.push(`/lead?appointment=${item.lead_id}`)}
        />
      </div>
    </div>
  );
}
