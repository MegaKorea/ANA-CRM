import { AppError } from '@/errors/app-error';
import { HttpStatusCode } from '@/constants/enums';

type SupabaseErrorLike = { message?: string } | null | undefined;

/**
 * Throw nghiệp vụ — cùng thứ tự với `new AppError(code, statusCode, message)`
 * (chuẩn đang dùng ở auth.service / validators).
 *
 * @example fail('QR_INVALID', HttpStatusCode.NOT_FOUND, 'Mã QR không hợp lệ.')
 */
export function fail(
  code: string,
  statusCode: number = HttpStatusCode.BAD_REQUEST,
  message?: string,
): never {
  throw new AppError(code, statusCode, message);
}

/**
 * Map lỗi Supabase/PostgREST → AppError (DB_ERROR).
 */
export function fromSupabase(
  error: SupabaseErrorLike,
  fallback = 'Lỗi cơ sở dữ liệu.',
  statusCode: number = HttpStatusCode.INTERNAL_SERVER_ERROR,
): never {
  throw new AppError('DB_ERROR', statusCode, error?.message?.trim() || fallback);
}

/**
 * Nếu Supabase trả `error` thì throw; không thì tiếp tục.
 */
export function throwIfSupabaseError(
  error: SupabaseErrorLike,
  fallback?: string,
): void {
  if (error) {
    fromSupabase(error, fallback);
  }
}
