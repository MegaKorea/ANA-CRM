import { AppError } from '@/errors';
import { HttpStatusCode, UserErrorCode, UserStatusDb } from '@/constants/enums';
import { generateStrongPassword } from '@/lib/utils/password';
import { PasswordPolicyNumber } from '@/constants/password';

export interface CreateUserInput {
  full_name: string;
  password: string;
  phone?: string;
  avatar?: string;
  sex?: string;
  age?: number;
  address?: string;
  birth_day?: string;
  role_id: number;
  status?: UserStatusDb;
}

export interface UpdateUserInput {
  full_name?: string;
  password?: string;
  phone?: string;
  avatar?: string;
  sex?: string;
  age?: number;
  address?: string;
  birth_day?: string;
  role_id?: number;
  status?: UserStatusDb;
}

export function validateUserId(id: unknown): number {
  if (typeof id !== 'string') {
    throw new AppError(UserErrorCode.INVALID_ID, HttpStatusCode.BAD_REQUEST);
  }

  const parsedId = parseInt(id, 10);

  if (Number.isNaN(parsedId) || parsedId <= 0) {
    throw new AppError(UserErrorCode.INVALID_ID, HttpStatusCode.BAD_REQUEST);
  }

  return parsedId;
}

function validateOptionalStringField(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new AppError(UserErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  return trimmedValue;
}

function validateOptionalNumberField(value: unknown): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new AppError(UserErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  return value;
}

function validateOptionalDateField(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new AppError(UserErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  const date = new Date(trimmedValue);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(UserErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  return trimmedValue;
}

function validateStatusField(value: unknown): UserStatusDb | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new AppError(UserErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  if (value === UserStatusDb.ACTIVE) {
    return UserStatusDb.ACTIVE;
  }

  if (value === UserStatusDb.BANNED) {
    return UserStatusDb.BANNED;
  }

  if (value === UserStatusDb.DELETED) {
    return UserStatusDb.DELETED;
  }

  throw new AppError(UserErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
}

function validateRoleIdField(value: unknown, isRequired: boolean): number | undefined {
  if (value === undefined || value === null) {
    if (isRequired) {
      throw new AppError(UserErrorCode.ROLE_ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }
    return undefined;
  }

  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
    throw new AppError(UserErrorCode.ROLE_ID_INVALID, HttpStatusCode.BAD_REQUEST);
  }

  return value;
}

function validateFullNameField(value: unknown, isRequired: boolean): string | undefined {
  if (value === undefined || value === null) {
    if (isRequired) {
      throw new AppError(UserErrorCode.FULL_NAME_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new AppError(UserErrorCode.FULL_NAME_REQUIRED, HttpStatusCode.BAD_REQUEST);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    if (isRequired) {
      throw new AppError(UserErrorCode.FULL_NAME_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }
    return undefined;
  }

  return trimmedValue;
}

function validatePasswordField(value: unknown, isRequired: boolean): string | undefined {
  if (value === undefined || value === null) {
    if (isRequired) {
      throw new AppError(UserErrorCode.PASSWORD_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new AppError(UserErrorCode.PASSWORD_REQUIRED, HttpStatusCode.BAD_REQUEST);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    if (isRequired) {
      throw new AppError(UserErrorCode.PASSWORD_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }
    return undefined;
  }

  if (trimmedValue.length < PasswordPolicyNumber.MIN_LENGTH) {
    throw new AppError(UserErrorCode.PASSWORD_WEAK, HttpStatusCode.BAD_REQUEST);
  }

  return trimmedValue;
}

export function validateCreateUserInput(input: unknown): CreateUserInput {
  if (!input || typeof input !== 'object') {
    throw new AppError(UserErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const data = input as Record<string, unknown>;

  const fullName = validateFullNameField(data.full_name, true);
  const roleId = validateRoleIdField(data.role_id, true);

  let password = validatePasswordField(data.password, false);

  if (!password) {
    password = generateStrongPassword();
  }

  if (!fullName) {
    throw new AppError(UserErrorCode.FULL_NAME_REQUIRED, HttpStatusCode.BAD_REQUEST);
  }

  if (!roleId) {
    throw new AppError(UserErrorCode.ROLE_ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
  }

  return {
    full_name: fullName,
    password,
    phone: validateOptionalStringField(data.phone),
    avatar: validateOptionalStringField(data.avatar),
    sex: validateOptionalStringField(data.sex),
    age: validateOptionalNumberField(data.age),
    address: validateOptionalStringField(data.address),
    birth_day: validateOptionalDateField(data.birth_day),
    role_id: roleId,
    status: validateStatusField(data.status),
  };
}

export function validateUpdateUserInput(input: unknown): UpdateUserInput {
  if (!input || typeof input !== 'object') {
    throw new AppError(UserErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const data = input as Record<string, unknown>;

  const fullName = validateFullNameField(data.full_name, false);
  const roleId = validateRoleIdField(data.role_id, false);
  const password = validatePasswordField(data.password, false);

  const result: UpdateUserInput = {};

  if (fullName !== undefined) {
    result.full_name = fullName;
  }

  if (roleId !== undefined) {
    result.role_id = roleId;
  }

  if (password !== undefined) {
    result.password = password;
  }

  const phone = validateOptionalStringField(data.phone);
  const avatar = validateOptionalStringField(data.avatar);
  const sex = validateOptionalStringField(data.sex);
  const age = validateOptionalNumberField(data.age);
  const address = validateOptionalStringField(data.address);
  const birthDay = validateOptionalDateField(data.birth_day);
  const status = validateStatusField(data.status);

  if (phone !== undefined) {
    result.phone = phone;
  }

  if (avatar !== undefined) {
    result.avatar = avatar;
  }

  if (sex !== undefined) {
    result.sex = sex;
  }

  if (age !== undefined) {
    result.age = age;
  }

  if (address !== undefined) {
    result.address = address;
  }

  if (birthDay !== undefined) {
    result.birth_day = birthDay;
  }

  if (status !== undefined) {
    result.status = status;
  }

  return result;
}

