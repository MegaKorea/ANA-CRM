import { RoleErrorCode, HttpStatusCode, ParseIntBase } from '@/constants/enums';
import { AppError } from '@/errors';

interface CreateRoleInput {
  name: string;
  code: string;
  description?: string;
}

interface UpdateRoleInput {
  name?: string;
  code?: string;
  description?: string;
}

export function validateCreateRoleInput(input: unknown): CreateRoleInput {
  if (!input || typeof input !== 'object') {
    throw new AppError(RoleErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const data = input as Record<string, unknown>;

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    throw new AppError(RoleErrorCode.NAME_REQUIRED, HttpStatusCode.BAD_REQUEST);
  }

  if (!data.code || typeof data.code !== 'string' || data.code.trim().length === 0) {
    throw new AppError(RoleErrorCode.CODE_REQUIRED, HttpStatusCode.BAD_REQUEST);
  }

  return {
    name: data.name.trim(),
    code: data.code.trim(),
    description: data.description && typeof data.description === 'string' ? data.description.trim() : undefined,
  };
}

export function validateUpdateRoleInput(input: unknown): UpdateRoleInput {
  if (!input || typeof input !== 'object') {
    throw new AppError(RoleErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const data = input as Record<string, unknown>;

  const result: UpdateRoleInput = {};

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      throw new AppError(RoleErrorCode.NAME_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }
    result.name = data.name.trim();
  }

  if (data.code !== undefined) {
    if (typeof data.code !== 'string' || data.code.trim().length === 0) {
      throw new AppError(RoleErrorCode.CODE_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }
    result.code = data.code.trim();
  }

  if (data.description !== undefined) {
    result.description = typeof data.description === 'string' ? data.description.trim() : undefined;
  }

  return result;
}

export function validateRoleId(id: unknown): number {
  if (typeof id !== 'string') {
    throw new AppError(RoleErrorCode.INVALID_ID, HttpStatusCode.BAD_REQUEST);
  }

  const parsedId = parseInt(id, ParseIntBase.DECIMAL);

  if (isNaN(parsedId) || parsedId <= 0) {
    throw new AppError(RoleErrorCode.INVALID_ID, HttpStatusCode.BAD_REQUEST);
  }

  return parsedId;
}
