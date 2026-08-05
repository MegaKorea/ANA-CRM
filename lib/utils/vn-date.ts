export const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';

export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isIsoDate(value: string): boolean {
  return ISO_DATE_RE.test(value);
}

export function toVnDate(value: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: VN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

export function vnNowClock(): { date: string; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: VN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '0';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

export function vnMinutesOfDay(value: string): number {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: VN_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minute = Number(
    parts.find((part) => part.type === 'minute')?.value ?? 0,
  );
  return hour * 60 + minute;
}

export function formatVnTimeHm(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: VN_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

function calendarDateAtUtcNoon(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00Z`);
}

function isCalendarIsoDate(isoDate: string): boolean {
  return ISO_DATE_RE.test(isoDate);
}

export function formatIsoDateDay(isoDate: string): string {
  if (!isCalendarIsoDate(isoDate)) return '';
  return String(Number(isoDate.slice(8, 10)));
}

export function formatIsoDateDayMonth(isoDate: string): string {
  if (!isCalendarIsoDate(isoDate)) return '';
  return `${Number(isoDate.slice(8, 10))}/${Number(isoDate.slice(5, 7))}`;
}

export function formatIsoDateDayMonthYear(isoDate: string): string {
  if (!isCalendarIsoDate(isoDate)) return '';
  return `${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}/${isoDate.slice(0, 4)}`;
}

export function formatIsoDateWeekdayDayMonth(isoDate: string): string {
  if (!isCalendarIsoDate(isoDate)) return '';
  const weekday = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'UTC',
    weekday: 'long',
  }).format(calendarDateAtUtcNoon(isoDate));
  return `${weekday}, ${formatIsoDateDayMonth(isoDate)}`;
}

export function formatIsoMonthYear(isoDate: string): string {
  if (!isCalendarIsoDate(isoDate) && !/^\d{4}-\d{2}/.test(isoDate)) return '';
  const monthStart = `${isoDate.slice(0, 7)}-01`;
  if (!isCalendarIsoDate(monthStart)) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  }).format(calendarDateAtUtcNoon(monthStart));
}

export function vnDayStartIso(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00+07:00`).toISOString();
}

export function vnDayEndIso(isoDate: string): string {
  return new Date(`${isoDate}T23:59:59.999+07:00`).toISOString();
}

export function eachDateInclusive(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T12:00:00Z`);
  const last = new Date(`${endDate}T12:00:00Z`);
  while (cursor <= last) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

export function previousPeriodOfSameLength(
  startDate: string,
  endDate: string,
): { startDate: string; endDate: string } {
  const start = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);
  const days =
    Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);

  const prevEnd = new Date(start);
  prevEnd.setUTCDate(prevEnd.getUTCDate() - 1);

  const prevStart = new Date(prevEnd);
  prevStart.setUTCDate(prevStart.getUTCDate() - (days - 1));

  return {
    startDate: prevStart.toISOString().slice(0, 10),
    endDate: prevEnd.toISOString().slice(0, 10),
  };
}

export function quotePostgrestValue(value: string): string {
  return `"${value}"`;
}

export function addDaysIsoDate(isoDate: string, days: number): string {
  const cursor = new Date(`${isoDate}T12:00:00Z`);
  cursor.setUTCDate(cursor.getUTCDate() + days);
  return cursor.toISOString().slice(0, 10);
}

export function startOfWeekMonday(isoDate: string): string {
  const cursor = new Date(`${isoDate}T12:00:00Z`);
  const day = cursor.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  cursor.setUTCDate(cursor.getUTCDate() + diff);
  return cursor.toISOString().slice(0, 10);
}

export function endOfWeekMonday(weekStart: string): string {
  return addDaysIsoDate(weekStart, 6);
}

export function weekDatesFromMonday(weekStart: string): string[] {
  return eachDateInclusive(weekStart, endOfWeekMonday(weekStart));
}

export function startOfMonth(isoDate: string): string {
  return `${isoDate.slice(0, 7)}-01`;
}

export function endOfMonth(isoDate: string): string {
  const [y, m] = isoDate.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0, 12, 0, 0));
  return last.toISOString().slice(0, 10);
}

export function addMonthsIsoDate(isoDate: string, months: number): string {
  const [y, m] = isoDate.split('-').map(Number);
  const cursor = new Date(Date.UTC(y, m - 1 + months, 1, 12, 0, 0));
  return cursor.toISOString().slice(0, 10);
}

export function monthGridDates(monthStart: string): string[] {
  const gridStart = startOfWeekMonday(startOfMonth(monthStart));
  return eachDateInclusive(gridStart, addDaysIsoDate(gridStart, 41));
}
