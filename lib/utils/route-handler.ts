import { NextResponse } from 'next/server';
import { AppError } from '@/errors';
import { HttpStatusCode } from '@/constants/enums';

export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'statusCode' in error &&
    typeof (error as { code?: unknown }).code === 'string' &&
    typeof (error as { statusCode?: unknown }).statusCode === 'number'
  );
}

export function createErrorResponse(
  error: unknown,
  defaultErrorCode: string
): NextResponse {
  if (isAppError(error)) {
    return NextResponse.json(
      { code: error.code, message: error.message },
      { status: error.statusCode }
    );
  }
  return NextResponse.json(
    { code: defaultErrorCode, message: defaultErrorCode },
    { status: HttpStatusCode.INTERNAL_SERVER_ERROR }
  );
}

export function handleRouteError(
  error: unknown,
  defaultErrorCode: string
): NextResponse {
  return createErrorResponse(error, defaultErrorCode);
}
