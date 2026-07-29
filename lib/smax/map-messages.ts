import type {
  SmaxChatMessage,
  SmaxMessageAttachment,
  SmaxThreadRef,
} from '@/lib/smax/types';
import {
  asRecord,
  asString,
  idsMatch,
  withFbPrefix,
} from '@/lib/smax/utils';

function extractRawList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;

  const root = asRecord(payload);
  if (!root) return [];
  if (Array.isArray(root.data)) return root.data;

  return [];
}

function extractAttachments(item: Record<string, unknown>): unknown[] {
  if (Array.isArray(item.attachments)) return item.attachments;

  const facebook = asRecord(item.facebook);
  if (!facebook) return [];

  if (Array.isArray(facebook.attachments)) return facebook.attachments;

  const nested = asRecord(facebook.attachments);
  if (nested && Array.isArray(nested.data)) return nested.data;

  return [];
}

function mapAttachment(
  raw: unknown,
  index: number
): SmaxMessageAttachment | null {
  const item = asRecord(raw);
  if (!item) return null;

  const payload = asRecord(item.payload);
  const url =
    asString(item.url) ??
    asString(item.preview_url) ??
    asString(payload?.url) ??
    asString(asRecord(payload?.image_data)?.url) ??
    asString(asRecord(payload?.image_data)?.preview_url);

  if (!url) return null;

  return {
    id: asString(item.id) ?? `att-${index}`,
    type: asString(item.type) ?? asString(item.mime_type),
    url,
    name: asString(item.name) ?? asString(item.filename),
    mime_type: asString(item.mime_type),
    size: typeof item.size === 'number' ? item.size : undefined,
    preview_url: asString(item.preview_url) ?? url,
  };
}

function resolveIsFromPage(
  item: Record<string, unknown>,
  thread: SmaxThreadRef
): boolean {
  const pagePid = asString(item.page_pid) ?? withFbPrefix(thread.pageId);
  const senderPid = asString(item.sender_pid);

  if (senderPid && idsMatch(senderPid, pagePid)) return true;
  if (senderPid && idsMatch(senderPid, thread.facebookId)) return false;
  if (asString(item.author_id)) return true;
  if (item.customer_created_at != null && item.customer_created_at !== '') {
    return false;
  }

  return false;
}

function mapOneMessage(
  raw: unknown,
  index: number,
  thread: SmaxThreadRef
): SmaxChatMessage | null {
  const item = asRecord(raw);
  if (!item) return null;

  const text = asString(item.message);
  const attachments = extractAttachments(item)
    .map(mapAttachment)
    .filter((att): att is SmaxMessageAttachment => att !== null);

  if (!text && attachments.length === 0) return null;

  const isFromPage = resolveIsFromPage(item, thread);
  const type = asString(item.type)?.toLowerCase();

  return {
    id: asString(item.id) ?? `msg-${index}`,
    text,
    createdAt: asString(item.created_at),
    isFromPage,
    isAi: type === 'ai' || type === 'bot',
    senderName: isFromPage ? 'ANA' : thread.customerName,
    senderAvatar: isFromPage ? undefined : thread.customerAvatar || undefined,
    attachments,
  };
}

export function mapSmaxMessagesPayload(
  payload: unknown,
  thread: SmaxThreadRef
): SmaxChatMessage[] {
  return extractRawList(payload)
    .map((item, index) => mapOneMessage(item, index, thread))
    .filter((msg): msg is SmaxChatMessage => msg !== null)
    .toReversed();
}
