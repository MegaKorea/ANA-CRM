import { AppError } from '@/errors';
import { HttpStatusCode } from '@/constants/enums';
import { EnvKey, getOptionalEnv, getRequiredEnv } from '@/config/env.config';
import {
  SMAX_DEFAULT_API_BASE_URL,
  SMAX_DEFAULT_BIZ_ALIAS,
  SMAX_MESSAGES_LIMIT,
} from '@/constants/smax';
import { mapSmaxMessagesPayload } from '@/lib/smax/map-messages';
import { withFbPrefix } from '@/lib/smax/utils';
import type { SmaxConversationResult, SmaxThreadRef } from '@/lib/smax/types';

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

function buildMessagesUrl(params: FetchSmaxMessagesParams): string {
  const baseUrl = (
    getOptionalEnv(EnvKey.SMAX_API_BASE_URL) ?? SMAX_DEFAULT_API_BASE_URL
  ).replace(/\/$/, '');
  const bizAlias =
    params.bizAlias ||
    getOptionalEnv(EnvKey.SMAX_BIZ_ALIAS) ||
    SMAX_DEFAULT_BIZ_ALIAS;
  const limit = params.limit ?? SMAX_MESSAGES_LIMIT;

  return (
    `${baseUrl}/bizs/${encodeURIComponent(bizAlias)}` +
    `/pages/${encodeURIComponent(withFbPrefix(params.pageId))}` +
    `/threads/${encodeURIComponent(withFbPrefix(params.facebookId))}` +
    `/messages?sort=-created_at&limit=${limit}`
  );
}

/** Server-only: fetch thread messages from Smax with Bearer token from env. */
export async function fetchSmaxThreadMessages(
  params: FetchSmaxMessagesParams
): Promise<SmaxConversationResult> {
  const token = getRequiredEnv(EnvKey.SMAX_API_TOKEN);
  const url = buildMessagesUrl(params);

  const thread: SmaxThreadRef = {
    pageId: params.pageId,
    facebookId: params.facebookId,
    bizAlias:
      params.bizAlias ||
      getOptionalEnv(EnvKey.SMAX_BIZ_ALIAS) ||
      SMAX_DEFAULT_BIZ_ALIAS,
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

  const contentType = response.headers.get('content-type') ?? '';
  const rawText = await response.text();

  if (!response.ok) {
    throw new AppError(
      SmaxErrorCode.FETCH_FAILED,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      `Smax messages failed (${response.status})`
    );
  }

  if (!contentType.includes('application/json')) {
    throw new AppError(
      SmaxErrorCode.INVALID_RESPONSE,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      'Smax API trả về HTML thay vì JSON. Kiểm tra SMAX_API_BASE_URL.'
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawText);
  } catch {
    throw new AppError(
      SmaxErrorCode.INVALID_RESPONSE,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      'Smax API trả về JSON không hợp lệ'
    );
  }

  return {
    thread,
    messages: mapSmaxMessagesPayload(payload, thread),
  };
}
