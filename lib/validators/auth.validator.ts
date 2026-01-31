import { AppError } from '@/errors';
import { HttpStatusCode, AuthErrorCode } from '@/constants/enums';
import { validateEmailField, validateRequiredStringField } from '@/lib/utils/validation';

export interface LoginInput {
  email: string;
  password: string;
}

export function validateLoginInput(input: unknown): LoginInput {
  if (!input || typeof input !== 'object') {
    throw new AppError(AuthErrorCode.INVALID_CREDENTIALS, HttpStatusCode.BAD_REQUEST);
  }

  const data = input as Record<string, unknown>;

  const email = validateEmailField(
    data.email,
    true,
    AuthErrorCode.EMAIL_REQUIRED,
    AuthErrorCode.EMAIL_INVALID
  ) as string;

  const password = validateRequiredStringField(
    data.password,
    AuthErrorCode.PASSWORD_REQUIRED
  );

  return {
    email,
    password,
  };
}
