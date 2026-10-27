import { memo, type ReactNode } from 'react';
import dayjs from 'dayjs';
import {
  LuArrowRight,
  LuCalendarDays,
  LuChartNoAxesColumn,
  LuCircleCheck,
  LuMessageCircleMore,
  LuMinus,
  LuMoon,
  LuPhone,
  LuSun,
} from 'react-icons/lu';
import { useLeads } from '@/lib/hooks/use-leads';
import { useAppointmentsInRange } from '@/lib/hooks/use-appointments';
import { useLeadStatistics } from '@/lib/hooks/use-lead-statistics';
import { LeadStatus, DateFormat } from '@/constants/enums';
import styles from './LeadSummaryCards.module.scss';

type Tone = 'blue' | 'orange' | 'green' | 'purple' | 'amber';

interface StatCardProps {
  icon: ReactNode;
  tone: Tone;
  label: string;
  value: number;
  loading?: boolean;
  active?: boolean;
  onClick?: () => void;
}

function StatCard({ icon, tone, label, value, loading, active, onClick }: StatCardProps) {
  const content = (
    <>
      <span className={`${styles.icon} ${styles[tone]}`}>{icon}</span>
      <div className={styles.text}>
        <span className={styles.value}>{loading ? '–' : value.toLocaleString('vi-VN')}</span>
        <span className={styles.label}>{label}</span>
      </div>
    </>
  );

  if (!onClick) return <div className={styles.stat}>{content}</div>;

  return (
    <button
      type="button"
      className={`${styles.stat} ${styles.clickable} ${active ? styles.active : ''}`}
      aria-pressed={active}
      onClick={onClick}
    >
      {content}
    </button>
  );
}

function Connector({ tone, dash }: { tone: Tone; dash?: boolean }) {
  return (
    <span className={`${styles.connector} ${styles[`${tone}Text`]}`} aria-hidden>
      {dash ? <LuMinus /> : <LuArrowRight />}
    </span>
  );
}

export interface LeadSummaryFilters {
  search?: string;
  status?: LeadStatus;
  source?: string;
  courseId?: string;
  /** Created-at bounds as sent to the leads API (dates or exact ISO boundaries). */
  startDate?: string;
  endDate?: string;
}

/** Which stat card is filtering the lead table, if any. */
export type LeadStatFilter = 'booked' | 'converted' | 'today' | 'tomorrow';

/** Created-at range the "Data" funnel counts: the table's range, else today. */
export function resolveSummaryRange(filters: Pick<LeadSummaryFilters, 'startDate' | 'endDate'>) {
  if (filters.startDate || filters.endDate) {
    return { startDate: filters.startDate, endDate: filters.endDate };
  }
  const today = dayjs().format(DateFormat.ISO_DATE);
  return { startDate: today, endDate: today };
}

interface LeadSummaryCardsProps {
  filters: LeadSummaryFilters;
  activeFilter?: LeadStatFilter;
  /** Called with the clicked card's filter, or undefined to clear it. */
  onFilterChange?: (filter: LeadStatFilter | undefined) => void;
}

/**
 * Pipeline stats above the lead table. The "Data" funnel defaults to today
 * and follows the table's filters: every step after "Tin nhắn" is counted from
 * the same cohort of leads (created in the range), so an appointment counts
 * toward the leads it came from, not toward the day it is scheduled on. The
 * today/tomorrow appointment counts are always fixed to those days.
 */
export const LeadSummaryCards = memo(function LeadSummaryCards({
  filters,
  activeFilter,
  onFilterChange,
}: LeadSummaryCardsProps) {
  const today = dayjs().format(DateFormat.ISO_DATE);
  const tomorrow = dayjs().add(1, 'day').format(DateFormat.ISO_DATE);

  const { startDate, endDate } = resolveSummaryRange(filters);

  // Clicking the active card again clears the filter.
  const cardFilter = (filter: LeadStatFilter) =>
    onFilterChange && {
      active: activeFilter === filter,
      onClick: () => onFilterChange(activeFilter === filter ? undefined : filter),
    };

  // SMAX takes plain VN dates.
  const rangeEnd = endDate ? dayjs(endDate).format(DateFormat.ISO_DATE) : today;
  const rangeStart = startDate ? dayjs(startDate).format(DateFormat.ISO_DATE) : rangeEnd;

  // limit: 1 — only the `total` count is needed, not the rows.
  const leadParams = {
    search: filters.search,
    status: filters.status,
    source: filters.source,
    course_id: filters.courseId,
    startDate,
    endDate,
    page: 1,
    limit: 1,
  };
  const statusExcludesConverted = !!filters.status && filters.status !== LeadStatus.CONVERTED;

  // "Tin nhắn" is SMAX's new-customer count (customer_new_total); it only
  // follows the date range since SMAX knows nothing about our lead filters.
  const { data: statistics, isLoading: isLoadingMessages } = useLeadStatistics(
    rangeStart,
    rangeEnd,
  );
  const { data: allLeads, isLoading: isLoadingAll } = useLeads(leadParams);
  const { data: bookedLeads, isLoading: isLoadingBooked } = useLeads({
    ...leadParams,
    hasAppointment: true,
  });
  const { data: convertedLeads, isLoading: isLoadingConverted } = useLeads({
    ...leadParams,
    status: LeadStatus.CONVERTED,
  });

  // Today/tomorrow are counted by appointment date, regardless of filters.
  const { data: todayAppointments, isLoading: isLoadingToday } = useAppointmentsInRange(
    today,
    today,
  );
  const { data: tomorrowAppointments, isLoading: isLoadingTomorrow } = useAppointmentsInRange(
    tomorrow,
    tomorrow,
  );

  return (
    <section className={`${styles.panel} mb-section`}>
      <div className={styles.group}>
        <h3 className={`${styles.heading} ${styles.blueText}`}>
          <LuChartNoAxesColumn /> Data
        </h3>
        <div className={styles.row}>
          <StatCard
            icon={<LuMessageCircleMore />}
            tone="blue"
            label="Tin nhắn"
            value={statistics?.smaxNewCustomers ?? 0}
            loading={isLoadingMessages}
          />
          <Connector tone="blue" />
          <StatCard
            icon={<LuPhone />}
            tone="blue"
            label="SĐT"
            value={allLeads?.total ?? 0}
            loading={isLoadingAll}
            onClick={onFilterChange && (() => onFilterChange(undefined))}
          />
          <Connector tone="blue" />
          <StatCard
            icon={<LuCalendarDays />}
            tone="orange"
            label="Lịch hẹn"
            value={bookedLeads?.total ?? 0}
            loading={isLoadingBooked}
            {...cardFilter('booked')}
          />
          <Connector tone="green" />
          <StatCard
            icon={<LuCircleCheck />}
            tone="green"
            label="Thành công"
            value={statusExcludesConverted ? 0 : (convertedLeads?.total ?? 0)}
            loading={isLoadingConverted}
            {...cardFilter('converted')}
          />
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <h3 className={`${styles.heading} ${styles.purpleText}`}>
          <LuCalendarDays /> Lịch hẹn
        </h3>
        <div className={styles.row}>
          <StatCard
            icon={<LuCalendarDays />}
            tone="purple"
            label="Tổng số lịch hẹn"
            value={bookedLeads?.total ?? 0}
            loading={isLoadingBooked}
            {...cardFilter('booked')}
          />
          <Connector tone="purple" dash />
          <StatCard
            icon={<LuSun />}
            tone="amber"
            label="Lịch hẹn hôm nay"
            value={todayAppointments?.length ?? 0}
            loading={isLoadingToday}
            {...cardFilter('today')}
          />
          <Connector tone="purple" />
          <StatCard
            icon={<LuMoon />}
            tone="purple"
            label="Lịch hẹn ngày mai"
            value={tomorrowAppointments?.length ?? 0}
            loading={isLoadingTomorrow}
            {...cardFilter('tomorrow')}
          />
        </div>
      </div>
    </section>
  );
});
