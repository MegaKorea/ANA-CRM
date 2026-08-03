import { AppError } from '@/errors/app-error';
import { ConfigErrorCode, HttpStatusCode } from '@/constants/enums';

const LEGACY_SERVICE_ROLE_KEY = 'NEXT_PUBLIC_SERVICE_ROLE_KEY';

export enum EnvKey {
  SUPABASE_URL = 'NEXT_PUBLIC_SUPABASE_URL',
  SUPABASE_ANON_KEY = 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  SERVICE_ROLE_KEY = 'SUPABASE_SERVICE_ROLE_KEY',
  API_BASE_URL = 'NEXT_PUBLIC_API_BASE_URL',
  NODE_ENV = 'NODE_ENV',
  VAPID_PUBLIC_KEY = 'VAPID_PUBLIC_KEY',
  VAPID_PRIVATE_KEY = 'VAPID_PRIVATE_KEY',
  VAPID_SUBJECT = 'VAPID_SUBJECT',
  CRON_SECRET = 'CRON_SECRET',
  ENABLE_PUSH_SCHEDULER = 'ENABLE_PUSH_SCHEDULER',
  SMAX_API_TOKEN = 'SMAX_API_TOKEN',
  SMAX_API_BASE_URL = 'SMAX_API_BASE_URL',
  SMAX_BIZ_ALIAS = 'SMAX_BIZ_ALIAS',
  SMAX_PAGE_PIDS = 'SMAX_PAGE_PIDS',
}

function readEnv(name: string): string | undefined {
  const raw = process.env[name];
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getRequiredEnv(key: EnvKey): string {
  const value =
    readEnv(key) ||
    (key === EnvKey.SERVICE_ROLE_KEY ? readEnv(LEGACY_SERVICE_ROLE_KEY) : undefined);

  if (!value) {
    throw new AppError(
      ConfigErrorCode.MISSING_ENV,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      `Thiếu biến môi trường: ${key}`,
    );
  }
  return value;
}

export function getOptionalEnv(key: EnvKey): string | undefined {
  if (key === EnvKey.SERVICE_ROLE_KEY) {
    return readEnv(key) || readEnv(LEGACY_SERVICE_ROLE_KEY);
  }
  return readEnv(key);
}
