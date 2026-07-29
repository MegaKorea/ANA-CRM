import type { SmaxLog, SmaxThreadRef } from '@/lib/smax/types';
import { SMAX_DEFAULT_BIZ_ALIAS } from '@/constants/smax';
import { asRecord, asString, stripFbPrefix } from '@/lib/smax/utils';

function uniqueUrls(...candidates: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const url of candidates) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    result.push(url);
  }
  return result;
}

export function parseSmaxThreadRef(smaxLog: unknown): SmaxThreadRef | null {
  const log = asRecord(smaxLog) as SmaxLog | null;
  if (!log) return null;

  const facebook = asRecord(log.facebook);

  const pageId =
    asString(facebook?.page_id) ??
    asString(log.page_id) ??
    (asString(log.page_pid) ? stripFbPrefix(asString(log.page_pid)!) : undefined);

  const facebookId =
    asString(facebook?.id) ??
    (asString(log.thread_tid) ? stripFbPrefix(asString(log.thread_tid)!) : undefined);

  if (!pageId || !facebookId) return null;

  const avatarUrls = uniqueUrls(
    asString(log.picture),
    asString(facebook?.picture)
  );

  return {
    pageId,
    facebookId,
    bizAlias: asString(log.biz_alias) ?? SMAX_DEFAULT_BIZ_ALIAS,
    customerName:
      asString(log.name) ??
      asString(log.profile_name) ??
      asString(facebook?.name) ??
      'Khách hàng',
    customerAvatar: avatarUrls[0] ?? '',
    customerAvatarFallbacks: avatarUrls.slice(1),
    pageName: asString(facebook?.page_name) ?? 'ANA',
  };
}

export function hasSmaxConversation(smaxLog: unknown): boolean {
  return parseSmaxThreadRef(smaxLog) !== null;
}
