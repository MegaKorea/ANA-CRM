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
