import type {
  SmaxCustomerStatistics,
  SmaxStatisticsCalendarDay,
} from '@/lib/smax/types';
import { asRecord } from '@/lib/smax/utils';

function toNonNegativeInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return Math.round(value);
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return Math.round(parsed);
  }
  return null;
}

function firstPositiveInt(...values: unknown[]): number {
  for (const value of values) {
    const n = toNonNegativeInt(value);
    if (n != null && n > 0) return n;
  }
  return toNonNegativeInt(values[0]) ?? 0;
}

function toCalendarDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  return parsed.toISOString().slice(0, 10);
}

function mapCalendars(raw: unknown): SmaxStatisticsCalendarDay[] {
  if (!Array.isArray(raw)) return [];

  const byDate = new Map<string, SmaxStatisticsCalendarDay>();

  for (const row of raw) {
    const day = asRecord(row);
    if (!day) continue;
    const date = toCalendarDate(day.time);
    if (!date) continue;

    const messages =
      toNonNegativeInt(day.customer_message_total_calendar) ?? 0;
    const interactions =
      (toNonNegativeInt(day.interaction_message) ?? 0) +
      (toNonNegativeInt(day.interaction_comment) ?? 0);
    const leads = toNonNegativeInt(day.lead_total) ?? 0;
    const orders = firstPositiveInt(
      day.order_total,
      day.register_total,
      day.registered_total,
      day.customer_order_total,
    );

    const existing = byDate.get(date);
    if (existing) {
      existing.messages += messages;
      existing.interactions += interactions;
      existing.leads += leads;
      existing.orders += orders;
    } else {
      byDate.set(date, { date, messages, interactions, leads, orders });
    }
  }

  return [...byDate.values()].toSorted((a, b) => a.date.localeCompare(b.date));
}

export function resolveSmaxRegisteredTotal(data: Record<string, unknown>): number {
  return firstPositiveInt(
    data.customer_order_total,
    data.customer_register_total,
    data.customer_registered_total,
    data.register_total,
    data.registered_total,
    data.order_total,
  );
}

export function mapSmaxCustomerStatistics(payload: unknown): SmaxCustomerStatistics {
  const root = asRecord(payload);
  const data = asRecord(root?.data) ?? root ?? {};
  const calendars = mapCalendars(data.calendars);
  const ordersFromRange = resolveSmaxRegisteredTotal(data);
  const ordersFromCalendars = calendars.reduce((acc, day) => acc + day.orders, 0);

  return {
    messages: toNonNegativeInt(data.customer_message_total) ?? 0,
    data: toNonNegativeInt(data.customer_lead_total) ?? 0,
    orders: ordersFromRange > 0 ? ordersFromRange : ordersFromCalendars,
    calendars,
    raw: payload,
  };
}
