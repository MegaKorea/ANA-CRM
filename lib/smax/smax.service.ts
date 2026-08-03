import { AppError } from '@/errors';
import { HttpStatusCode } from '@/constants/enums';
import { EnvKey, getOptionalEnv, getRequiredEnv } from '@/config/env.config';
import {
  SMAX_DEFAULT_API_BASE_URL,
  SMAX_DEFAULT_BIZ_ALIAS,
  SMAX_DEFAULT_PAGE_PIDS,
  SMAX_MESSAGES_LIMIT,
  SMAX_TAGS_TOP,
  SmaxCustomerStatTarget,
  SmaxCustomerStatType,
} from '@/constants/smax';
import { mapSmaxMessagesPayload } from '@/lib/smax/map-messages';
import { mapSmaxCustomerStatistics } from '@/lib/smax/map-statistics';
import { mapSmaxTagStatistics } from '@/lib/smax/map-tags';
import { withFbPrefix } from '@/lib/smax/utils';
import type {
  SmaxConversationResult,
  SmaxCustomerStatistics,
  SmaxCustomerStatisticsRequest,
  SmaxTagStatistics,
  SmaxThreadRef,
} from '@/lib/smax/types';

const SmaxErrorCode = {
  FETCH_FAILED: 'SMAX_FETCH_FAILED',
  INVALID_RESPONSE: 'SMAX_INVALID_RESPONSE',
} as const;

export interface FetchSmaxMessagesParams {
  pageId: string;
  facebookId: string;
  bizAlias?: string;
  limit?: number;
}

export interface FetchSmaxCustomerStatisticsParams {
  startDate: string;
  endDate: string;
  pagePids?: string[];
  type?: string;
  bizAlias?: string;
  applyAll?: boolean;
  keyTime?: string;
  top?: number;
}

function getBizAlias(override?: string): string {
  return (
    override ||
    getOptionalEnv(EnvKey.SMAX_BIZ_ALIAS) ||
    SMAX_DEFAULT_BIZ_ALIAS
  );
}

function getBaseUrl(): string {
  return (
    getOptionalEnv(EnvKey.SMAX_API_BASE_URL) ?? SMAX_DEFAULT_API_BASE_URL
  ).replace(/\/$/, '');
}

function buildMessagesUrl(params: FetchSmaxMessagesParams): string {
  const bizAlias = getBizAlias(params.bizAlias);
  const limit = params.limit ?? SMAX_MESSAGES_LIMIT;

  return (
    `${getBaseUrl()}/bizs/${encodeURIComponent(bizAlias)}` +
    `/pages/${encodeURIComponent(withFbPrefix(params.pageId))}` +
    `/threads/${encodeURIComponent(withFbPrefix(params.facebookId))}` +
    `/messages?sort=-created_at&limit=${limit}`
  );
}

function buildCustomerStatisticsUrl(bizAlias?: string): string {
  return (
    `${getBaseUrl()}/bizs/${encodeURIComponent(getBizAlias(bizAlias))}` +
    `/statistics-v2/customers`
  );
}

function buildTagStatisticsUrl(bizAlias?: string): string {
  return (
    `${getBaseUrl()}/bizs/${encodeURIComponent(getBizAlias(bizAlias))}` +
    `/statistics/tags`
  );
}

function normalizePagePid(pid: string): string {
  return withFbPrefix(pid.replace(/^fb:/i, 'fb'));
}

function parsePagePids(raw: string | undefined): string[] {
  if (!raw) return [...SMAX_DEFAULT_PAGE_PIDS];
  const pids = raw
    .split(',')
    .map((pid) => pid.trim())
    .filter(Boolean)
    .map(normalizePagePid);
  return pids.length > 0 ? pids : [...SMAX_DEFAULT_PAGE_PIDS];
}

function resolveAllowedPagePids(requested?: string[]): string[] {
  const allowed = parsePagePids(getOptionalEnv(EnvKey.SMAX_PAGE_PIDS));
  if (!requested || requested.length === 0) return allowed;

  const allowedSet = new Set(allowed);
  const filtered = requested
    .map(normalizePagePid)
    .filter((pid) => allowedSet.has(pid));

  return filtered.length > 0 ? filtered : allowed;
}

function toSmaxUtcRangeBound(isoDate: string, endOfDay: boolean): string {
  const local = new Date(
    `${isoDate}T${endOfDay ? '23:59:59' : '00:00:00'}+07:00`,
  );
  if (Number.isNaN(local.getTime())) {
    throw new AppError(
      SmaxErrorCode.INVALID_RESPONSE,
      HttpStatusCode.BAD_REQUEST,
      'Ngày thống kê SMAX không hợp lệ',
    );
  }

  return `${local.toISOString().slice(0, 19).replace('T', ' ')} +00:00`;
}

function resolveKeyTime(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T00:00:00+07:00`).getTime();
  const end = new Date(`${endDate}T00:00:00+07:00`).getTime();
  const days = Math.max(1, Math.round((end - start) / 86_400_000) + 1);
  if (days <= 1) return '1_day';
  if (days <= 7) return '7_days';
  if (days <= 30) return '30_days';
  return 'custom';
}

async function parseSmaxJsonResponse(response: Response, label: string): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  const rawText = await response.text();

  if (!response.ok) {
    throw new AppError(
      SmaxErrorCode.FETCH_FAILED,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      `Smax ${label} failed (${response.status})`,
    );
  }

  if (!contentType.includes('application/json')) {
    throw new AppError(
      SmaxErrorCode.INVALID_RESPONSE,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      'Smax API trả về HTML thay vì JSON. Kiểm tra SMAX_API_BASE_URL.',
    );
  }

  try {
    return JSON.parse(rawText) as unknown;
  } catch {
    throw new AppError(
      SmaxErrorCode.INVALID_RESPONSE,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      'Smax API trả về JSON không hợp lệ',
    );
  }
}
export async function fetchSmaxThreadMessages(
  params: FetchSmaxMessagesParams,
): Promise<SmaxConversationResult> {
  const token = getRequiredEnv(EnvKey.SMAX_API_TOKEN);
  const url = buildMessagesUrl(params);

  const thread: SmaxThreadRef = {
    pageId: params.pageId,
    facebookId: params.facebookId,
    bizAlias: getBizAlias(params.bizAlias),
    customerName: 'Khách hàng',
    customerAvatar: '',
    customerAvatarFallbacks: [],
    pageName: 'ANA',
  };

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  const payload = await parseSmaxJsonResponse(response, 'messages');

  return {
    thread,
    messages: mapSmaxMessagesPayload(payload, thread),
  };
}

export async function fetchSmaxCustomerStatistics(
  params: FetchSmaxCustomerStatisticsParams,
): Promise<SmaxCustomerStatistics> {
  const token = getRequiredEnv(EnvKey.SMAX_API_TOKEN);
  const url = buildCustomerStatisticsUrl(params.bizAlias);

  const pagePids = resolveAllowedPagePids(params.pagePids);

  const body: SmaxCustomerStatisticsRequest = {
    from: toSmaxUtcRangeBound(params.startDate, false),
    to: toSmaxUtcRangeBound(params.endDate, true),
    apply_all: params.applyAll ?? true,
    key_time: params.keyTime ?? resolveKeyTime(params.startDate, params.endDate),
    page_pids: pagePids,
    target: SmaxCustomerStatTarget.CUSTOMER_AND_PAGE,
    type: params.type ?? SmaxCustomerStatType.MESSAGE_AND_COMMENT,
    tag_aliases: [],
    top: params.top ?? 10,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const payload = await parseSmaxJsonResponse(response, 'statistics');
  return mapSmaxCustomerStatistics(payload);
}

export async function fetchSmaxTagStatistics(
  params: FetchSmaxCustomerStatisticsParams,
): Promise<SmaxTagStatistics> {
  const token = getRequiredEnv(EnvKey.SMAX_API_TOKEN);
  const url = buildTagStatisticsUrl(params.bizAlias);

  const top = params.top ?? SMAX_TAGS_TOP;
  const body: SmaxCustomerStatisticsRequest = {
    from: toSmaxUtcRangeBound(params.startDate, false),
    to: toSmaxUtcRangeBound(params.endDate, true),
    apply_all: params.applyAll ?? true,
    key_time: params.keyTime ?? resolveKeyTime(params.startDate, params.endDate),
    page_pids: params.pagePids?.length
      ? resolveAllowedPagePids(params.pagePids)
      : [],
    target: SmaxCustomerStatTarget.CUSTOMER_AND_PAGE,
    type: params.type ?? SmaxCustomerStatType.MESSAGE_AND_COMMENT,
    tag_aliases: [],
    top,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const payload = await parseSmaxJsonResponse(response, 'tags');
  return mapSmaxTagStatistics(payload, { top });
}
