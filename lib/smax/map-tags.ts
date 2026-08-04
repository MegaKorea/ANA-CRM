import { SMAX_TAGS_TOP } from '@/constants/smax';
import type { SmaxTagStatistics, SmaxTagTotal } from '@/lib/smax/types';
import { formatSmaxTagLabel, smaxTagMergeKey } from '@/lib/smax/tag-labels';
import { asRecord, toNonNegativeInt } from '@/lib/smax/utils';

type ListMeta = { name: string; listAdd: number; curAdd: number };
type Period = { name: string; add: number; remove: number };
type RankedTag = SmaxTagTotal & { listAdd: number };

function readTagName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const name = value.trim();
  return name || null;
}

function mapTagsList(raw: unknown): Map<string, ListMeta> {
  const byKey = new Map<string, ListMeta>();
  if (!Array.isArray(raw)) return byKey;

  for (const row of raw) {
    const tag = asRecord(row);
    const rawName = readTagName(tag?.name);
    if (!tag || !rawName) continue;

    const listAdd = toNonNegativeInt(tag.add);
    const curAdd = toNonNegativeInt(tag.cur_add ?? tag.curAdd);
    if (listAdd === 0 && curAdd === 0) continue;

    const key = smaxTagMergeKey(rawName);
    const existing = byKey.get(key);
    if (existing) {
      existing.listAdd += listAdd;
      existing.curAdd += curAdd;
    } else {
      byKey.set(key, { name: formatSmaxTagLabel(rawName), listAdd, curAdd });
    }
  }

  return byKey;
}

function mapTagsCalendar(raw: unknown): Map<string, Period> {
  const byKey = new Map<string, Period>();
  if (!Array.isArray(raw)) return byKey;

  for (const series of raw) {
    const tag = asRecord(series);
    const rawName = readTagName(tag?.name);
    if (!tag || !rawName || !Array.isArray(tag.calendars)) continue;

    let add = 0;
    let remove = 0;
    for (const point of tag.calendars) {
      const day = asRecord(point);
      if (!day) continue;
      add += toNonNegativeInt(day.add);
      remove += toNonNegativeInt(day.remove);
    }
    if (add === 0 && remove === 0) continue;

    const key = smaxTagMergeKey(rawName);
    const existing = byKey.get(key);
    if (existing) {
      existing.add += add;
      existing.remove += remove;
    } else {
      byKey.set(key, { name: formatSmaxTagLabel(rawName), add, remove });
    }
  }

  return byKey;
}

function compareRanked(a: RankedTag, b: RankedTag): number {
  return (
    b.net - a.net ||
    b.add - a.add ||
    b.listAdd - a.listAdd ||
    a.name.localeCompare(b.name, 'vi')
  );
}

export function mapSmaxTagStatistics(
  payload: unknown,
  options?: { top?: number },
): SmaxTagStatistics {
  const root = asRecord(payload);
  const data = asRecord(root?.data) ?? root ?? {};
  const top = options?.top ?? SMAX_TAGS_TOP;

  const listByKey = mapTagsList(data.tags);
  const periodByKey = mapTagsCalendar(data.tags_calendar);

  const ranked: RankedTag[] = [];
  let totalNet = 0;

  for (const [key, period] of periodByKey) {
    const net = period.add - period.remove;
    totalNet += net;
    const meta = listByKey.get(key);
    ranked.push({
      name: meta?.name ?? period.name,
      add: period.add,
      curAdd: meta?.curAdd ?? 0,
      remove: period.remove,
      net,
      listAdd: meta?.listAdd ?? 0,
    });
  }

  const tags: SmaxTagTotal[] = ranked
    .toSorted(compareRanked)
    .slice(0, top)
    .map(({ listAdd: _listAdd, ...tag }) => tag);

  return { tags, totalNet };
}
