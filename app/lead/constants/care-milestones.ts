import dayjs, { type Dayjs } from 'dayjs';
import { DateFormat } from '@/constants/enums';

/**
 * "Chăm khách" milestones, counted in calendar days since the lead was
 * created (today = 0). The created-at cell is wrapped in the milestone's tag
 * colour, and the lead filter can narrow the table to one milestone.
 */
export const CareMilestone = {
  DAY_1: 'day_1',
  DAY_3: 'day_3',
  DAY_7: 'day_7',
  DAY_14: 'day_14',
  MONTH_1: 'month_1',
  OLD: 'old',
} as const;

export type CareMilestone = (typeof CareMilestone)[keyof typeof CareMilestone];

interface CareMilestoneConfig {
  value: CareMilestone;
  label: string;
  color: string;
  minDays: number;
  /** Inclusive; `null` means no upper bound. */
  maxDays: number | null;
}

export const CARE_MILESTONES: readonly CareMilestoneConfig[] = [
  { value: CareMilestone.DAY_1, label: '1 ngày', color: 'green', minDays: 0, maxDays: 1 },
  { value: CareMilestone.DAY_3, label: '3 ngày', color: 'orange', minDays: 2, maxDays: 3 },
  { value: CareMilestone.DAY_7, label: '7 ngày', color: 'blue', minDays: 4, maxDays: 7 },
  { value: CareMilestone.DAY_14, label: '14 ngày', color: 'purple', minDays: 8, maxDays: 14 },
  { value: CareMilestone.MONTH_1, label: '1 tháng', color: 'magenta', minDays: 15, maxDays: 30 },
  { value: CareMilestone.OLD, label: 'Khách cũ', color: 'default', minDays: 31, maxDays: null },
];

export function getCareMilestone(createdAt: string): CareMilestoneConfig | undefined {
  const ageDays = dayjs().startOf('day').diff(dayjs(createdAt).startOf('day'), 'day');
  return CARE_MILESTONES.find(
    (m) => ageDays >= m.minDays && (m.maxDays == null || ageDays <= m.maxDays),
  );
}

/**
 * `startDate`/`endDate` for the leads API. Without a milestone the created-at
 * range is passed through as plain dates (unchanged behaviour); with one, the
 * two are intersected and sent as exact local-day boundaries so the filter
 * matches the tag shown in the table.
 */
export function resolveCreatedAtBounds(
  createdAtRange: [Dayjs | null, Dayjs | null] | null,
  milestone: CareMilestone | undefined,
): { startDate?: string; endDate?: string } {
  const config = CARE_MILESTONES.find((m) => m.value === milestone);
  if (!config) {
    return {
      startDate: createdAtRange?.[0]?.format(DateFormat.ISO_DATE),
      endDate: createdAtRange?.[1]?.format(DateFormat.ISO_DATE),
    };
  }

  const today = dayjs();
  let start =
    config.maxDays == null ? null : today.subtract(config.maxDays, 'day').startOf('day');
  let end = today.subtract(config.minDays, 'day').endOf('day');

  const rangeStart = createdAtRange?.[0]?.startOf('day');
  const rangeEnd = createdAtRange?.[1]?.endOf('day');
  if (rangeStart && (!start || rangeStart.isAfter(start))) start = rangeStart;
  if (rangeEnd && rangeEnd.isBefore(end)) end = rangeEnd;

  return { startDate: start?.toISOString(), endDate: end.toISOString() };
}
