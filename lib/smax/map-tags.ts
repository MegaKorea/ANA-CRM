import { SMAX_TAGS_TOP } from '@/constants/smax';
import type { SmaxTagStatistics, SmaxTagTotal } from '@/lib/smax/types';
import { formatSmaxTagLabel, smaxTagMergeKey } from '@/lib/smax/tag-labels';
import { asRecord, toNonNegativeInt } from '@/lib/smax/utils';

type TagBucket = { name: string; attached: number; removed: number };

function readTagName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const name = value.trim();
  return name || null;
}

function mapTagsFromCalendar(raw: unknown, top: number): SmaxTagTotal[] {
  if (!Array.isArray(raw)) return [];

  const byKey = new Map<string, TagBucket>();

  for (const series of raw) {
    const tag = asRecord(series);
    const rawName = readTagName(tag?.name);
    if (!tag || !rawName || !Array.isArray(tag.calendars)) continue;

    let attached = 0;
    let removed = 0;
    for (const point of tag.calendars) {
      const day = asRecord(point);
      if (!day) continue;
      attached += toNonNegativeInt(day.add);
      removed += toNonNegativeInt(day.remove);
    }
    if (attached === 0 && removed === 0) continue;

    const key = smaxTagMergeKey(rawName);
    const existing = byKey.get(key);
    if (existing) {
      existing.attached += attached;
      existing.removed += removed;
    } else {
      byKey.set(key, {
        name: formatSmaxTagLabel(rawName),
        attached,
        removed,
      });
    }
  }

  return [...byKey.values()]
    .map(({ name, attached, removed }) => ({
      name,
      net: attached - removed,
    }))
    .toSorted((a, b) => b.net - a.net || a.name.localeCompare(b.name, 'vi'))
    .slice(0, top);
}

function padFromTopTags(
  current: SmaxTagTotal[],
  rawTop: unknown,
  top: number,
): SmaxTagTotal[] {
  if (current.length >= top || !Array.isArray(rawTop)) return current;

  const used = new Set(current.map((tag) => smaxTagMergeKey(tag.name)));
  const next = [...current];

  for (const row of rawTop) {
    if (next.length >= top) break;
    const rawName = readTagName(asRecord(row)?.name);
    if (!rawName) continue;
    const key = smaxTagMergeKey(rawName);
    if (used.has(key)) continue;
    used.add(key);
    next.push({ name: formatSmaxTagLabel(rawName), net: 0 });
  }

  return next;
}

export function mapSmaxTagStatistics(
  payload: unknown,
  options?: { top?: number },
): SmaxTagStatistics {
  const root = asRecord(payload);
  const data = asRecord(root?.data) ?? root ?? {};
  const top = options?.top ?? SMAX_TAGS_TOP;

  return {
    tags: padFromTopTags(
      mapTagsFromCalendar(data.tags_calendar, top),
      data.tags,
      top,
    ),
  };
}
