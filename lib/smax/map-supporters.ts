import { SMAX_SUPPORTER_DIRECTORY } from '@/constants/smax';
import type { SmaxSupporterRow, SmaxSupporterStatistics } from '@/lib/smax/types';
import { asRecord, asString, toNonNegativeInt } from '@/lib/smax/utils';

type TotalsRow = { userId: string; number: number };
type ReplyRow = { userId: string; averageSec: number };
type MetricKey = 'messages' | 'conversations' | 'replyTimeSec';

function toNonNegativeNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return 0;
}

function isAllowedSupporter(userId: string): boolean {
  return userId in SMAX_SUPPORTER_DIRECTORY;
}

function readUserTotals(raw: unknown): TotalsRow[] {
  if (!Array.isArray(raw)) return [];
  const rows: TotalsRow[] = [];
  for (const item of raw) {
    const row = asRecord(item);
    const userId = asString(row?.user_id) || asString(row?.userId);
    if (!row || !userId || !isAllowedSupporter(userId)) continue;
    rows.push({ userId, number: toNonNegativeInt(row.number ?? row.value ?? row.count) });
  }
  return rows;
}

function readReplyTimes(raw: unknown): ReplyRow[] {
  if (!Array.isArray(raw)) return [];
  const rows: ReplyRow[] = [];
  for (const item of raw) {
    const row = asRecord(item);
    const userId = asString(row?.user_id) || asString(row?.userId);
    if (!row || !userId || !isAllowedSupporter(userId)) continue;
    const average = row.reply_time_average ?? row.replyTimeAverage ?? row.average;
    if (average === null || average === undefined) continue;
    rows.push({ userId, averageSec: toNonNegativeNumber(average) });
  }
  return rows;
}

function mapSmaxBizUserAvatars(bizPayload: unknown): Map<string, string> {
  const root = asRecord(bizPayload);
  const data = asRecord(root?.data) ?? root;
  const users = data?.users;
  const byId = new Map<string, string>();
  if (!Array.isArray(users)) return byId;

  for (const item of users) {
    const row = asRecord(item);
    const id = asString(row?.id) || asString(row?.user_id) || asString(row?.userId);
    if (!row || !id || !isAllowedSupporter(id)) continue;
    const picture =
      asString(row.picture) || asString(row.avatar) || asString(row.photo);
    if (picture) byId.set(id, picture);
  }

  return byId;
}

function createSupporterRow(
  userId: string,
  avatars: Map<string, string>,
): SmaxSupporterRow | null {
  const name = SMAX_SUPPORTER_DIRECTORY[userId];
  if (!name) return null;
  return {
    id: userId,
    name,
    avatar: avatars.get(userId) ?? null,
    messages: 0,
    conversations: 0,
    replyTimeSec: 0,
  };
}

function setMetric(
  byId: Map<string, SmaxSupporterRow>,
  avatars: Map<string, string>,
  userId: string,
  metric: MetricKey,
  value: number,
): void {
  const current = byId.get(userId) ?? createSupporterRow(userId, avatars);
  if (!current) return;
  byId.set(userId, { ...current, [metric]: value });
}

function readNestedBlock(payload: unknown, key: string): Record<string, unknown> | null {
  const root = asRecord(payload);
  const data = asRecord(root?.data) ?? root;
  return asRecord(data?.[key]) ?? data;
}

export function mapSmaxSupporterStatistics(input: {
  message: unknown;
  conversation: unknown;
  timeReply: unknown;
  biz?: unknown;
}): SmaxSupporterStatistics {
  const avatars = mapSmaxBizUserAvatars(input.biz);
  const byId = new Map<string, SmaxSupporterRow>();

  const messageBlock = readNestedBlock(input.message, 'message');
  for (const row of readUserTotals(messageBlock?.user_totals)) {
    setMetric(byId, avatars, row.userId, 'messages', row.number);
  }

  const conversationBlock = readNestedBlock(input.conversation, 'conversation');
  for (const row of readUserTotals(conversationBlock?.user_totals)) {
    setMetric(byId, avatars, row.userId, 'conversations', row.number);
  }

  const replyRoot = asRecord(input.timeReply);
  const replyData = asRecord(replyRoot?.data) ?? replyRoot;
  for (const row of readReplyTimes(replyData?.reply_time ?? replyData?.replyTime)) {
    setMetric(byId, avatars, row.userId, 'replyTimeSec', row.averageSec);
  }

  const rows = [...byId.values()].toSorted(
    (a, b) =>
      b.messages - a.messages ||
      b.conversations - a.conversations ||
      a.name.localeCompare(b.name, 'vi'),
  );

  return { rows };
}
