import { AppError } from '@/errors';
import { HttpStatusCode } from '@/constants/enums';
import { validateEmailFormat } from '@/lib/utils/email';

export function validateRequiredStringField(
  value: unknown,
  errorCode: string
): string {
  if (value === undefined || value === null) {
    throw new AppError(errorCode, HttpStatusCode.BAD_REQUEST);
  }

  if (typeof value !== 'string') {
    throw new AppError(errorCode, HttpStatusCode.BAD_REQUEST);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new AppError(errorCode, HttpStatusCode.BAD_REQUEST);
  }

  return trimmedValue;
}

export function validateOptionalStringField(
  value: unknown,
  errorCode: string
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new AppError(errorCode, HttpStatusCode.BAD_REQUEST);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  return trimmedValue;
}

export function validateEmailField(
  value: unknown,
  isRequired: boolean,
  requiredErrorCode: string,
  invalidErrorCode: string
): string | undefined {
  if (value === undefined || value === null) {
    if (isRequired) {
      throw new AppError(requiredErrorCode, HttpStatusCode.BAD_REQUEST);
    }
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new AppError(requiredErrorCode, HttpStatusCode.BAD_REQUEST);
  }

  const trimmedValue = value.trim().toLowerCase();

  if (!trimmedValue) {
    if (isRequired) {
      throw new AppError(requiredErrorCode, HttpStatusCode.BAD_REQUEST);
    }
    return undefined;
  }

  if (!validateEmailFormat(trimmedValue)) {
    throw new AppError(invalidErrorCode, HttpStatusCode.BAD_REQUEST);
  }

  return trimmedValue;
}

export function validatePasswordField(
  value: unknown,
  isRequired: boolean,
  requiredErrorCode: string,
  weakErrorCode: string,
  minLength: number
): string | undefined {
  if (value === undefined || value === null) {
    if (isRequired) {
      throw new AppError(requiredErrorCode, HttpStatusCode.BAD_REQUEST);
    }
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new AppError(requiredErrorCode, HttpStatusCode.BAD_REQUEST);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    if (isRequired) {
      throw new AppError(requiredErrorCode, HttpStatusCode.BAD_REQUEST);
    }
    return undefined;
  }

  if (trimmedValue.length < minLength) {
    throw new AppError(weakErrorCode, HttpStatusCode.BAD_REQUEST);
  }

  return trimmedValue;
}
