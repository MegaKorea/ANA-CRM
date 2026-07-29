import { AppError } from '@/errors';
import { ConfigErrorCode, HttpStatusCode } from '@/constants/enums';

export enum EnvKey {
  SUPABASE_URL = 'NEXT_PUBLIC_SUPABASE_URL',
  SUPABASE_ANON_KEY = 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  SERVICE_ROLE_KEY = 'NEXT_PUBLIC_SERVICE_ROLE_KEY',
  API_BASE_URL = 'NEXT_PUBLIC_API_BASE_URL',
  NODE_ENV = 'NODE_ENV',
  SMAX_API_TOKEN = 'SMAX_API_TOKEN',
  SMAX_API_BASE_URL = 'SMAX_API_BASE_URL',
  SMAX_BIZ_ALIAS = 'SMAX_BIZ_ALIAS',
}

export function getRequiredEnv(key: EnvKey): string {
  const value = process.env[key];
  if (!value) {
    throw new AppError(ConfigErrorCode.MISSING_ENV, HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
  return value;
}

export function getOptionalEnv(key: EnvKey): string | undefined {
  return process.env[key];
}

