import { AppError } from '@/errors/app-error';
import { HttpStatusCode } from '@/constants/enums';

type SupabaseErrorLike = { message?: string } | null | undefined;

export function fail(
  code: string,
  statusCode: number = HttpStatusCode.BAD_REQUEST,
  message?: string,
): never {
  throw new AppError(code, statusCode, message);
}

export function fromSupabase(
  error: SupabaseErrorLike,
  fallback = 'Lỗi cơ sở dữ liệu.',
  statusCode: number = HttpStatusCode.INTERNAL_SERVER_ERROR,
): never {
  throw new AppError('DB_ERROR', statusCode, error?.message?.trim() || fallback);
}

export function throwIfSupabaseError(
  error: SupabaseErrorLike,
  fallback?: string,
): void {
  if (error) {
    fromSupabase(error, fallback);
  }
}
