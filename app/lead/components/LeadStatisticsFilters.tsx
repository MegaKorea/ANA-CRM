'use client';

import { DatePicker, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { memo } from 'react';
import styles from './LeadStatisticsFilters.module.css';

const { RangePicker } = DatePicker;
const { Title } = Typography;

interface LeadStatisticsFiltersProps {
  dateRange: [Dayjs | null, Dayjs | null] | null;
  onDateRangeChange: (range: [Dayjs | null, Dayjs | null] | null) => void;
  /** @deprecated Layout switches via CSS; kept for call-site compat. */
  isMobile?: boolean;
  showTitle?: boolean;
}

export const LeadStatisticsFilters = memo(function LeadStatisticsFilters({
  dateRange,
  onDateRangeChange,
  showTitle = true,
}: LeadStatisticsFiltersProps) {
  return (
    <div className={styles.wrap}>
      {showTitle ? (
        <Title level={4} className={styles.title}>
          Thống kê tổng quan
        </Title>
      ) : null}

      <div className={styles.filters}>
        <span className={styles.label}>Bộ lọc ngày:</span>

        <div className={styles.desktopPicker}>
          <RangePicker
            value={dateRange}
            onChange={(dates) =>
              onDateRangeChange(dates as [Dayjs | null, Dayjs | null] | null)
            }
            format="DD/MM/YYYY"
            allowClear={false}
          />
        </div>

        <div className={styles.mobilePicker}>
          <DatePicker
            className={styles.mobileInput}
            value={dateRange?.[0]}
            onChange={(date) => onDateRangeChange([date, dateRange?.[1] || dayjs()])}
            format="DD/MM/YYYY"
            allowClear={false}
            inputReadOnly
          />
          <span className={styles.dash}>–</span>
          <DatePicker
            className={styles.mobileInput}
            value={dateRange?.[1]}
            onChange={(date) => onDateRangeChange([dateRange?.[0] || dayjs(), date])}
            format="DD/MM/YYYY"
            allowClear={false}
            inputReadOnly
          />
        </div>
      </div>
    </div>
  );
});
