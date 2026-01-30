import { AppError } from '@/errors';
import { HttpStatusCode, DatabaseErrorCode } from '@/constants/enums';

export function handleServiceError(
  error: unknown,
  defaultErrorCode: string,
  defaultStatusCode: number = HttpStatusCode.INTERNAL_SERVER_ERROR
): never {
  if (error instanceof AppError) {
    throw error;
  }
  throw new AppError(defaultErrorCode, defaultStatusCode);
}

export function validateDataExists<T>(
  data: T | null | undefined,
  errorCode: string,
  statusCode: number = HttpStatusCode.NOT_FOUND
): T {
  if (!data) {
    throw new AppError(errorCode, statusCode);
  }
  return data;
}

interface SupabaseError {
  code?: string;
  message?: string;
}

export function handleSupabaseError(
  error: SupabaseError | null | undefined,
  errorHandlers: {
    uniqueViolationNameErrorCode?: string;
    uniqueViolationCodeErrorCode?: string;
    foreignKeyViolationErrorCode?: string;
    notFoundErrorCode?: string;
    defaultErrorCode: string;
  },
  defaultStatusCode: number = HttpStatusCode.INTERNAL_SERVER_ERROR
): never {
  if (!error) {
    throw new AppError(errorHandlers.defaultErrorCode, defaultStatusCode);
  }

  if (error.code === DatabaseErrorCode.UNIQUE_VIOLATION) {
    if (error.message?.includes('name') && errorHandlers.uniqueViolationNameErrorCode) {
      throw new AppError(errorHandlers.uniqueViolationNameErrorCode, HttpStatusCode.CONFLICT);
    }
    if (error.message?.includes('code') && errorHandlers.uniqueViolationCodeErrorCode) {
      throw new AppError(errorHandlers.uniqueViolationCodeErrorCode, HttpStatusCode.CONFLICT);
    }
  }

  if (error.code === DatabaseErrorCode.FOREIGN_KEY_VIOLATION && errorHandlers.foreignKeyViolationErrorCode) {
    throw new AppError(errorHandlers.foreignKeyViolationErrorCode, HttpStatusCode.BAD_REQUEST);
  }

  if (error.code === DatabaseErrorCode.NOT_FOUND && errorHandlers.notFoundErrorCode) {
    throw new AppError(errorHandlers.notFoundErrorCode, HttpStatusCode.NOT_FOUND);
  }

  throw new AppError(errorHandlers.defaultErrorCode, defaultStatusCode);
}
