'use client';

import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Calendar,
  Empty,
  Segmented,
  Skeleton,
  Typography,
  type CalendarProps,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import Image from 'next/image';
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import type {
  UpcomingAppointment,
  UpcomingAppointmentChannel,
} from '@/lib/services/appointment.service';
import { useIsMobile } from '@/lib/hooks/use-mobile';
import {
  addDaysIsoDate,
  addMonthsIsoDate,
  endOfMonth,
  endOfWeekMonday,
  formatIsoDateDay,
  formatIsoDateDayMonth,
  formatIsoDateDayMonthYear,
  formatIsoDateWeekdayDayMonth,
  formatIsoMonthYear,
  formatVnTimeHm,
  startOfMonth,
  startOfWeekMonday,
  toVnDate,
  vnMinutesOfDay,
  vnNowClock,
  weekDatesFromMonday,
} from '@/lib/utils/vn-date';
import styles from './AppointmentsWeekCalendar.module.css';

const { Text, Title } = Typography;

export type CalendarViewMode = 'week' | 'month';

const EMPTY_APPOINTMENTS: UpcomingAppointment[] = [];

const WEEKDAY_FULL = [
  'Thứ 2',
  'Thứ 3',
  'Thứ 4',
  'Thứ 5',
  'Thứ 6',
  'Thứ 7',
  'Chủ Nhật',
] as const;

const WEEKDAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const;

const CHANNEL_LABEL: Record<
  Exclude<UpcomingAppointmentChannel, null>,
  string
> = {
  zalo: 'Zalo',
  facebook: 'Facebook',
};

const DEFAULT_HOUR_START = 8;
const DEFAULT_HOUR_END = 18;
const DEFAULT_EVENT_MINUTES = 60;
const HOUR_PX = 64;
const EVENT_MIN_HEIGHT_PX = 48;
const EVENT_VERTICAL_GAP_PX = 4;
const EVENT_COLUMN_INSET_PX = 6;
const EVENT_COLUMN_PAD_PX = 3;
const EVENT_TOP_OFFSET_PX = 2;
const NOW_TICK_MS = 60_000;
const EMPTY_NAME = '—';

type VnClock = {
  date: string;
  minutes: number;
};

type Props = {
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  anchorDate: string;
  onAnchorChange: (isoDate: string) => void;
  appointments?: UpcomingAppointment[];
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  title?: string;
  headerExtra?: ReactNode;
  onSelect?: (item: UpcomingAppointment) => void;
};

type AppointmentDisplay = {
  timeLabel: string;
  name: string;
  note: string | null;
  channelLabel: string | null;
  title: string;
};

type LaidOutEvent = {
  item: UpcomingAppointment;
  startMin: number;
  endMin: number;
  col: number;
  colCount: number;
};

type AppointmentCardVariant = 'timeGrid' | 'monthCell' | 'dayDetail';

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

function resolveChannelLabel(
  channel: UpcomingAppointmentChannel,
): string | null {
  if (channel === null) return null;
  return CHANNEL_LABEL[channel];
}

function buildAppointmentTitle(
  timeLabel: string,
  name: string,
  note: string | null,
): string {
  if (note) return `${timeLabel} · ${name} — ${note}`;
  return `${timeLabel} · ${name}`;
}

function readAppointmentDisplay(item: UpcomingAppointment): AppointmentDisplay {
  const timeLabel = formatVnTimeHm(item.appointment_date);
  const name = item.lead_full_name || EMPTY_NAME;
  const note = item.note?.trim() || null;
  const channelLabel = resolveChannelLabel(item.channel);
  return {
    timeLabel,
    name,
    note,
    channelLabel,
    title: buildAppointmentTitle(timeLabel, name, note),
  };
}

function formatHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return '12 PM';
  return `${hour - 12} PM`;
}

function isValidAppointmentDate(value: string): boolean {
  return !Number.isNaN(new Date(value).getTime());
}

function layoutDayEvents(items: UpcomingAppointment[]): LaidOutEvent[] {
  const events = items
    .filter((item) => isValidAppointmentDate(item.appointment_date))
    .map((item) => {
      const startMin = vnMinutesOfDay(item.appointment_date);
      return {
        item,
        startMin,
        endMin: startMin + DEFAULT_EVENT_MINUTES,
      };
    })
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);

  const columnEnds: number[] = [];
  const placed = events.map((event) => {
    let col = columnEnds.findIndex((end) => end <= event.startMin);
    if (col === -1) {
      col = columnEnds.length;
      columnEnds.push(event.endMin);
    } else {
      columnEnds[col] = event.endMin;
    }
    return { ...event, col };
  });

  const laidOut: LaidOutEvent[] = [];
  let index = 0;
  while (index < placed.length) {
    let clusterEnd = placed[index].endMin;
    let next = index + 1;
    while (next < placed.length && placed[next].startMin < clusterEnd) {
      clusterEnd = Math.max(clusterEnd, placed[next].endMin);
      next += 1;
    }
    const cluster = placed.slice(index, next);
    let maxCol = 0;
    for (const event of cluster) {
      if (event.col > maxCol) maxCol = event.col;
    }
    const colCount = maxCol + 1;
    for (const event of cluster) {
      laidOut.push({ ...event, colCount });
    }
    index = next;
  }
  return laidOut;
}

function resolveEventBoxStyle(
  startMin: number,
  endMin: number,
  col: number,
  colCount: number,
  rangeStartMin: number,
  rangeMinutes: number,
  bodyHeight: number,
): CSSProperties | null {
  if (rangeMinutes <= 0 || bodyHeight <= 0) return null;
  const rangeEndMin = rangeStartMin + rangeMinutes;
  if (endMin <= rangeStartMin || startMin >= rangeEndMin) return null;

  const clampedStart = Math.max(startMin, rangeStartMin);
  const clampedEnd = Math.min(endMin, rangeEndMin);
  const top =
    ((clampedStart - rangeStartMin) / rangeMinutes) * bodyHeight +
    EVENT_TOP_OFFSET_PX;
  const rawHeight =
    ((clampedEnd - clampedStart) / rangeMinutes) * bodyHeight -
    EVENT_VERTICAL_GAP_PX;
  const height = Math.max(
    EVENT_MIN_HEIGHT_PX,
    Math.min(rawHeight, bodyHeight - top),
  );
  const safeColCount = Math.max(1, colCount);
  const safeCol = Math.min(Math.max(0, col), safeColCount - 1);
  const width = `calc((100% - ${EVENT_COLUMN_INSET_PX}px) / ${safeColCount})`;
  const left = `calc(${EVENT_COLUMN_PAD_PX}px + ((100% - ${EVENT_COLUMN_INSET_PX}px) / ${safeColCount}) * ${safeCol})`;

  return { top, left, width, height };
}

function resolveHourRange(appointments: UpcomingAppointment[]): {
  hourStart: number;
  hourEnd: number;
} {
  let hourStart = DEFAULT_HOUR_START;
  let hourEnd = DEFAULT_HOUR_END;
  for (const item of appointments) {
    if (!isValidAppointmentDate(item.appointment_date)) continue;
    const startMin = vnMinutesOfDay(item.appointment_date);
    const endMin = startMin + DEFAULT_EVENT_MINUTES;
    hourStart = Math.min(hourStart, Math.floor(startMin / 60));
    hourEnd = Math.max(hourEnd, Math.ceil(endMin / 60));
  }
  hourStart = Math.max(0, Math.min(hourStart, DEFAULT_HOUR_START));
  hourEnd = Math.min(24, Math.max(hourEnd, DEFAULT_HOUR_END));
  if (hourEnd <= hourStart) hourEnd = hourStart + 1;
  return { hourStart, hourEnd };
}

function collectWeekAppointments(
  weekDays: string[],
  byDay: Map<string, UpcomingAppointment[]>,
): UpcomingAppointment[] {
  const list: UpcomingAppointment[] = [];
  for (const day of weekDays) {
    const items = byDay.get(day);
    if (items) list.push(...items);
  }
  return list;
}

function groupByDay(
  appointments: UpcomingAppointment[],
): Map<string, UpcomingAppointment[]> {
  const map = new Map<string, UpcomingAppointment[]>();
  for (const item of appointments) {
    if (!isValidAppointmentDate(item.appointment_date)) continue;
    const day = toVnDate(item.appointment_date);
    const bucket = map.get(day);
    if (bucket) bucket.push(item);
    else map.set(day, [item]);
  }
  for (const list of map.values()) {
    list.sort(
      (a, b) =>
        new Date(a.appointment_date).getTime() -
        new Date(b.appointment_date).getTime(),
    );
  }
  return map;
}

function resolveMonthDayStatusClass(
  dayIso: string,
  today: string,
  hasItems: boolean,
): string {
  if (!hasItems) return styles.calDayEmpty;
  if (dayIso < today) return styles.calDayPast;
  if (dayIso === today) return styles.calDayTodayStatus;
  return styles.calDayUpcoming;
}

function resolveDefaultMonthDay(
  monthStart: string,
  today: string,
): string {
  return today.slice(0, 7) === monthStart.slice(0, 7) ? today : monthStart;
}

function isSameMonth(dayIso: string, monthStart: string): boolean {
  return dayIso.slice(0, 7) === monthStart.slice(0, 7);
}

function ChannelDot({
  channel,
}: {
  channel: Exclude<UpcomingAppointmentChannel, null>;
}): ReactNode {
  if (channel === 'zalo') {
    return (
      <span className={styles.channel} aria-label="Zalo">
        <Image src="/zalo.jpg" alt="Zalo" fill sizes="16px" style={{ objectFit: 'cover' }} />
      </span>
    );
  }
  if (channel === 'facebook') {
    return (
      <span className={styles.channel} aria-label="Facebook">
        <Image src="/fb.png" alt="Facebook" fill sizes="16px" style={{ objectFit: 'cover' }} />
      </span>
    );
  }
  return null;
}

function AppointmentInfoButton({
  item,
  variant,
  style,
  stopPropagation,
  onSelect,
}: {
  item: UpcomingAppointment;
  variant: AppointmentCardVariant;
  style?: CSSProperties;
  stopPropagation?: boolean;
  onSelect?: (item: UpcomingAppointment) => void;
}): ReactNode {
  const display = readAppointmentDisplay(item);
  const classNames =
    variant === 'timeGrid'
      ? {
          root: styles.timeEvent,
          head: styles.timeEventHead,
          time: styles.timeEventTime,
          channel: styles.timeEventChannel,
          name: styles.timeEventName,
          note: styles.timeEventNote,
        }
      : variant === 'monthCell'
        ? {
            root: styles.calDayEvent,
            head: styles.calDayEventHead,
            time: styles.calDayEventTime,
            channel: styles.calDayEventChannel,
            name: styles.calDayEventName,
            note: styles.calDayEventNote,
          }
        : {
            root: styles.dayDetailCard,
            head: styles.dayDetailCardHead,
            time: styles.dayDetailCardTime,
            channel: styles.dayDetailCardChannel,
            name: styles.dayDetailCardName,
            note: styles.dayDetailCardNote,
          };

  return (
    <button
      type="button"
      className={classNames.root}
      style={style}
      title={display.title}
      onClick={(event) => {
        if (stopPropagation) event.stopPropagation();
        onSelect?.(item);
      }}
    >
      <span className={classNames.head}>
        <span className={classNames.time}>{display.timeLabel}</span>
        {item.channel !== null && display.channelLabel ? (
          <span className={classNames.channel}>
            <ChannelDot channel={item.channel} />
            {display.channelLabel}
          </span>
        ) : null}
      </span>
      <span className={classNames.name}>{display.name}</span>
      {display.note ? (
        <span className={classNames.note}>{display.note}</span>
      ) : null}
    </button>
  );
}

function DayDetailPanel({
  day,
  items,
  onSelect,
}: {
  day: string;
  items: UpcomingAppointment[];
  onSelect?: (item: UpcomingAppointment) => void;
}): ReactNode {
  return (
    <div className={styles.dayDetail}>
      <div className={styles.dayDetailHead}>
        <Text strong>{formatIsoDateWeekdayDayMonth(day)}</Text>
        <Text type="secondary" className={styles.dayDetailCount}>
          {items.length} lịch hẹn
        </Text>
      </div>
      {items.length === 0 ? (
        <Text type="secondary" className={styles.dayDetailEmpty}>
          Không có lịch hẹn trong ngày này
        </Text>
      ) : (
        <div className={styles.dayDetailList}>
          {items.map((item) => (
            <AppointmentInfoButton
              key={item.id}
              item={item}
              variant="dayDetail"
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AppointmentDayCell({
  day,
  dayIso,
  today,
  items,
  isToday,
  isSelected,
  inMonth,
  isMobile,
  onSelect,
}: {
  day: number;
  dayIso: string;
  today: string;
  items: UpcomingAppointment[];
  isToday: boolean;
  isSelected: boolean;
  inMonth: boolean;
  isMobile: boolean;
  onSelect?: (item: UpcomingAppointment) => void;
}): ReactNode {
  const hasItems = items.length > 0;
  const statusClass = resolveMonthDayStatusClass(dayIso, today, hasItems);

  return (
    <div
      className={cx(
        styles.calDay,
        statusClass,
        isToday && styles.calDayIsToday,
        isSelected && styles.calDaySelected,
        !inMonth && styles.calDayOut,
        isMobile && styles.calDayCompact,
      )}
    >
      <div className={styles.calDayTop}>
        <span className={styles.calDayNum}>{day}</span>
        {dayIso === today ? (
          <span className={styles.calDayBadge}>Hôm nay</span>
        ) : null}
        {!isMobile && hasItems ? (
          <span className={styles.calDayCount}>{items.length} lịch</span>
        ) : null}
        {isMobile && hasItems ? (
          <span className={styles.calDayDot} aria-hidden />
        ) : null}
      </div>

      {!isMobile && hasItems ? (
        <div className={styles.calDayBody}>
          {items.map((item) => (
            <AppointmentInfoButton
              key={item.id}
              item={item}
              variant="monthCell"
              stopPropagation
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function WeekTimeGrid({
  weekDays,
  byDay,
  today,
  vnClock,
  onSelect,
}: {
  weekDays: string[];
  byDay: Map<string, UpcomingAppointment[]>;
  today: string;
  vnClock: VnClock;
  onSelect?: (item: UpcomingAppointment) => void;
}): ReactNode {
  const isMobile = useIsMobile();
  const [mobileDay, setMobileDay] = useState<string | null>(null);

  const visibleDays = useMemo(() => {
    if (!isMobile) return weekDays;
    if (mobileDay && weekDays.includes(mobileDay)) return [mobileDay];
    return weekDays.includes(today) ? [today] : weekDays.slice(0, 1);
  }, [isMobile, weekDays, mobileDay, today]);

  const activeDay = visibleDays[0] ?? null;

  const rangeSource = useMemo(() => {
    if (isMobile && activeDay) return byDay.get(activeDay) ?? [];
    return collectWeekAppointments(weekDays, byDay);
  }, [isMobile, activeDay, byDay, weekDays]);

  const { hourStart, hourEnd } = useMemo(
    () => resolveHourRange(rangeSource),
    [rangeSource],
  );

  const hours = useMemo(() => {
    const list: number[] = [];
    for (let hour = hourStart; hour < hourEnd; hour += 1) list.push(hour);
    return list;
  }, [hourStart, hourEnd]);

  const rangeStartMin = hourStart * 60;
  const rangeMinutes = Math.max(1, (hourEnd - hourStart) * 60);
  const bodyHeight = hours.length * HOUR_PX;
  const columnCount = Math.max(1, visibleDays.length);

  const showNow =
    visibleDays.includes(vnClock.date) &&
    vnClock.minutes >= rangeStartMin &&
    vnClock.minutes <= rangeStartMin + rangeMinutes;

  const nowTop = showNow
    ? ((vnClock.minutes - rangeStartMin) / rangeMinutes) * bodyHeight
    : 0;

  return (
    <div className={cx(styles.timeWeek, isMobile && styles.timeWeekMobile)}>
      {isMobile ? (
        <div
          className={styles.mobileDayPicker}
          role="tablist"
          aria-label="Chọn ngày"
        >
          {weekDays.map((day, index) => {
            const count = byDay.get(day)?.length ?? 0;
            const selected = day === activeDay;
            const isToday = day === today;
            return (
              <button
                key={day}
                type="button"
                role="tab"
                aria-selected={selected}
                className={cx(
                  styles.mobileDayChip,
                  selected && styles.mobileDayChipSelected,
                  isToday && styles.mobileDayChipToday,
                  count > 0 && styles.mobileDayChipHasItems,
                )}
                onClick={() => setMobileDay(day)}
              >
                <span className={styles.mobileDayChipName}>
                  {WEEKDAY_SHORT[index]}
                </span>
                <span className={styles.mobileDayChipNum}>
                  {formatIsoDateDay(day)}
                </span>
                {count > 0 ? (
                  <span className={styles.mobileDayChipCount}>{count}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className={styles.timeWeekScroll}>
        <div
          className={cx(
            styles.timeWeekInner,
            isMobile && styles.timeWeekInnerMobile,
          )}
        >
          {!isMobile ? (
            <div className={styles.timeWeekHeader}>
              <div className={styles.timeGutterCorner} aria-hidden />
              {weekDays.map((day, index) => {
                const isToday = day === today;
                return (
                  <div
                    key={day}
                    className={cx(
                      styles.timeDayHead,
                      isToday && styles.timeDayHeadToday,
                    )}
                  >
                    <span className={styles.timeDayName}>
                      {WEEKDAY_FULL[index]}
                    </span>
                    <span className={styles.timeDayNum}>
                      {formatIsoDateDay(day)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : activeDay ? (
            <div className={styles.mobileDayTitle}>
              <Text strong className={styles.mobileDayTitleText}>
                {formatIsoDateWeekdayDayMonth(activeDay)}
              </Text>
              <Text type="secondary" className={styles.mobileDayTitleCount}>
                {byDay.get(activeDay)?.length ?? 0} lịch hẹn
              </Text>
            </div>
          ) : null}

          <div className={styles.timeWeekBody} style={{ height: bodyHeight }}>
            <div className={styles.timeGutter}>
              {hours.map((hour) => (
                <div
                  key={hour}
                  className={styles.timeGutterSlot}
                  style={{ height: HOUR_PX }}
                >
                  <span className={styles.timeGutterLabel}>
                    {formatHourLabel(hour)}
                  </span>
                </div>
              ))}
            </div>

            <div
              className={styles.timeGrid}
              style={
                {
                  ['--time-cols' as string]: String(columnCount),
                } as CSSProperties
              }
            >
              {hours.map((hour) => (
                <div
                  key={hour}
                  className={styles.timeHourRow}
                  style={{ height: HOUR_PX }}
                >
                  {visibleDays.map((day) => (
                    <div
                      key={`${day}-${hour}`}
                      className={cx(
                        styles.timeCell,
                        day === today && styles.timeCellToday,
                      )}
                    />
                  ))}
                </div>
              ))}

              <div className={styles.timeEventsLayer}>
                {visibleDays.map((day) => {
                  const laidOut = layoutDayEvents(byDay.get(day) ?? []);
                  return (
                    <div key={day} className={styles.timeDayCol}>
                      {laidOut.map(
                        ({
                          item,
                          startMin,
                          endMin,
                          col,
                          colCount: overlapCols,
                        }) => {
                          const boxStyle = resolveEventBoxStyle(
                            startMin,
                            endMin,
                            col,
                            overlapCols,
                            rangeStartMin,
                            rangeMinutes,
                            bodyHeight,
                          );
                          if (!boxStyle) return null;
                          return (
                            <AppointmentInfoButton
                              key={item.id}
                              item={item}
                              variant="timeGrid"
                              style={boxStyle}
                              onSelect={onSelect}
                            />
                          );
                        },
                      )}
                    </div>
                  );
                })}
              </div>

              {showNow ? (
                <div
                  className={styles.timeNowLine}
                  style={{ top: nowTop }}
                  aria-hidden
                >
                  <span className={styles.timeNowDot} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const AppointmentsWeekCalendar = memo(function AppointmentsWeekCalendar({
  viewMode,
  onViewModeChange,
  anchorDate,
  onAnchorChange,
  appointments = EMPTY_APPOINTMENTS,
  isLoading = false,
  isError = false,
  errorMessage,
  title = 'Lịch hẹn',
  headerExtra,
  onSelect,
}: Props): ReactNode {
  const [vnClock, setVnClock] = useState(() => vnNowClock());
  const today = vnClock.date;
  const isWeek = viewMode === 'week';
  const isMobile = useIsMobile();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    const tick = (): void => {
      setVnClock(vnNowClock());
    };
    tick();
    const timerId = window.setInterval(tick, NOW_TICK_MS);
    return () => window.clearInterval(timerId);
  }, []);

  const weekStart = useMemo(
    () => (isWeek ? startOfWeekMonday(anchorDate) : startOfWeekMonday(startOfMonth(anchorDate))),
    [isWeek, anchorDate],
  );
  const weekEnd = endOfWeekMonday(weekStart);
  const monthStart = startOfMonth(anchorDate);

  const weekDays = useMemo(() => weekDatesFromMonday(weekStart), [weekStart]);
  const byDay = useMemo(() => groupByDay(appointments), [appointments]);

  // Re-resolve the selected day whenever the view mode / displayed month /
  // "today" changes — adjusted during render (React's recommended
  // replacement for an effect that only resets state) instead of via effect.
  const selectionContext = `${isWeek}|${monthStart}|${today}`;
  const [prevSelectionContext, setPrevSelectionContext] = useState(selectionContext);
  if (selectionContext !== prevSelectionContext) {
    setPrevSelectionContext(selectionContext);
    if (isWeek) {
      setSelectedDay(null);
    } else if (!(selectedDay && isSameMonth(selectedDay, monthStart))) {
      setSelectedDay(resolveDefaultMonthDay(monthStart, today));
    }
  }

  const calendarValue = useMemo(() => {
    if (selectedDay) return dayjs(selectedDay);
    return dayjs(anchorDate);
  }, [anchorDate, selectedDay]);

  const selectedItems =
    selectedDay != null ? (byDay.get(selectedDay) ?? []) : [];

  const totalCount = appointments.length;
  const thisWeekStart = startOfWeekMonday(today);
  const isCurrentPeriod = isWeek
    ? weekStart === thisWeekStart
    : monthStart === startOfMonth(today);

  const rangeLabel = isWeek
    ? `${formatIsoDateDayMonth(weekStart)} – ${formatIsoDateDayMonthYear(weekEnd)}`
    : formatIsoMonthYear(monthStart);

  const goPrev = (): void => {
    if (isWeek) onAnchorChange(addDaysIsoDate(weekStart, -7));
    else onAnchorChange(addMonthsIsoDate(monthStart, -1));
  };

  const goNext = (): void => {
    if (isWeek) onAnchorChange(addDaysIsoDate(weekStart, 7));
    else onAnchorChange(addMonthsIsoDate(monthStart, 1));
  };

  const onSelectDate = useCallback(
    (value: Dayjs): void => {
      const key = value.format('YYYY-MM-DD');
      setSelectedDay(key);
      const nextMonth = startOfMonth(key);
      if (nextMonth !== monthStart) onAnchorChange(nextMonth);
    },
    [monthStart, onAnchorChange],
  );

  const onPanelChange = useCallback(
    (value: Dayjs): void => {
      onAnchorChange(value.startOf('month').format('YYYY-MM-DD'));
    },
    [onAnchorChange],
  );

  const dateFullCellRender = useCallback<
    NonNullable<CalendarProps<Dayjs>['fullCellRender']>
  >(
    (current, info) => {
      if (info.type !== 'date') return info.originNode;
      const key = current.format('YYYY-MM-DD');
      return (
        <AppointmentDayCell
          day={current.date()}
          dayIso={key}
          today={today}
          items={byDay.get(key) ?? []}
          isToday={key === today}
          isSelected={key === selectedDay}
          inMonth={current.format('YYYY-MM') === monthStart.slice(0, 7)}
          isMobile={isMobile}
          onSelect={onSelect}
        />
      );
    },
    [byDay, today, selectedDay, monthStart, isMobile, onSelect],
  );

  let body: ReactNode;
  if (isLoading) {
    body = <Skeleton active paragraph={{ rows: 10 }} />;
  } else if (isError) {
    body = (
      <Alert
        type="error"
        showIcon
        message="Không tải được lịch hẹn"
        description={errorMessage || 'Vui lòng thử lại sau.'}
      />
    );
  } else if (isWeek) {
    body = (
      <WeekTimeGrid
        weekDays={weekDays}
        byDay={byDay}
        today={today}
        vnClock={vnClock}
        onSelect={onSelect}
      />
    );
  } else {
    body = (
      <div className={styles.monthWrap}>
        <Calendar
          fullscreen
          value={calendarValue}
          onSelect={onSelectDate}
          onPanelChange={onPanelChange}
          headerRender={() => null}
          fullCellRender={dateFullCellRender}
          className={styles.calendar}
        />

        {isMobile && selectedDay ? (
          <DayDetailPanel
            day={selectedDay}
            items={selectedItems}
            onSelect={onSelect}
          />
        ) : null}

        {!isMobile && totalCount === 0 ? (
          <div className={styles.monthEmptyHint}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Không có lịch hẹn nào trong tháng này"
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Title level={5} className={styles.title}>
            {title}
          </Title>
          <Text type="secondary" className={styles.rangeHint}>
            {totalCount} lịch hẹn
            {isCurrentPeriod
              ? isWeek
                ? ' · tuần này'
                : ' · tháng này'
              : ''}
          </Text>
        </div>

        <div className={styles.toolbarRight}>
          {headerExtra}
          <Segmented
            size="small"
            className={styles.viewSwitch}
            value={viewMode}
            onChange={(value) => onViewModeChange(value as CalendarViewMode)}
            options={[
              { label: 'Tuần', value: 'week' },
              { label: 'Tháng', value: 'month' },
            ]}
          />
          <div className={styles.calNav} role="group" aria-label="Chọn kỳ">
            <Button
              type="text"
              className={styles.calNavBtn}
              icon={<LeftOutlined />}
              aria-label={isWeek ? 'Tuần trước' : 'Tháng trước'}
              onClick={goPrev}
            />
            <span className={styles.calNavLabel} title={rangeLabel}>
              {rangeLabel}
            </span>
            <Button
              type="text"
              className={styles.calNavBtn}
              icon={<RightOutlined />}
              aria-label={isWeek ? 'Tuần sau' : 'Tháng sau'}
              onClick={goNext}
            />
          </div>
        </div>
      </div>

      <div className={styles.content}>{body}</div>
    </div>
  );
});

export function getCalendarRange(
  viewMode: CalendarViewMode,
  anchorDate: string,
): { startDate: string; endDate: string } {
  if (viewMode === 'week') {
    const start = startOfWeekMonday(anchorDate);
    return { startDate: start, endDate: endOfWeekMonday(start) };
  }
  const monthStart = startOfMonth(anchorDate);
  const monthEnd = endOfMonth(monthStart);
  return {
    startDate: startOfWeekMonday(monthStart),
    endDate: endOfWeekMonday(monthEnd),
  };
}
