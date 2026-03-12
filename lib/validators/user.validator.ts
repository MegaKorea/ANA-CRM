import { AppError } from '@/errors';
import { HttpStatusCode, UserErrorCode, UserStatusDb, ValidationPattern } from '@/constants/enums';
import { generateStrongPassword } from '@/lib/utils/password';
import { PasswordPolicyNumber } from '@/constants/password';
import { formatPhoneToE164, validateE164Format, formatPhoneToLocal } from '@/lib/utils/phone';
import { validateEmailField, validatePasswordField } from '@/lib/utils/validation';

export interface CreateUserInput {
  email: string;
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
  email?: string;
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

export function validateUserId(id: unknown): string {
  if (typeof id !== 'string') {
    throw new AppError(UserErrorCode.INVALID_ID, HttpStatusCode.BAD_REQUEST);
  }

  const trimmedId = id.trim();

  const uuidRegex = new RegExp(ValidationPattern.UUID, 'i');
  if (!uuidRegex.test(trimmedId)) {
    throw new AppError(UserErrorCode.INVALID_ID, HttpStatusCode.BAD_REQUEST);
  }

  return trimmedId;
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


function validatePhoneField(value: unknown, isRequired: boolean): string | undefined {
  if (value === undefined || value === null) {
    if (isRequired) {
      throw new AppError(UserErrorCode.PHONE_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new AppError(UserErrorCode.PHONE_REQUIRED, HttpStatusCode.BAD_REQUEST);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    if (isRequired) {
      throw new AppError(UserErrorCode.PHONE_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }
    return undefined;
  }

  const formattedPhone = formatPhoneToE164(trimmedValue);

  if (!validateE164Format(formattedPhone)) {
    throw new AppError(UserErrorCode.PHONE_INVALID, HttpStatusCode.BAD_REQUEST);
  }

  return formatPhoneToLocal(formattedPhone);
}

export function validateCreateUserInput(input: unknown): CreateUserInput {
  if (!input || typeof input !== 'object') {
    throw new AppError(UserErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const data = input as Record<string, unknown>;

  const email = validateEmailField(
    data.email,
    true,
    UserErrorCode.EMAIL_REQUIRED,
    UserErrorCode.EMAIL_INVALID
  );
  const fullName = validateFullNameField(data.full_name, true);
  const roleId = validateRoleIdField(data.role_id, true);
  const phone = validatePhoneField(data.phone, false);

  let password = validatePasswordField(
    data.password,
    false,
    UserErrorCode.PASSWORD_REQUIRED,
    UserErrorCode.PASSWORD_WEAK,
    PasswordPolicyNumber.MIN_LENGTH
  );

  if (!password) {
    password = generateStrongPassword();
  }

  if (!email) {
    throw new AppError(UserErrorCode.EMAIL_REQUIRED, HttpStatusCode.BAD_REQUEST);
  }

  if (!fullName) {
    throw new AppError(UserErrorCode.FULL_NAME_REQUIRED, HttpStatusCode.BAD_REQUEST);
  }

  if (!roleId) {
    throw new AppError(UserErrorCode.ROLE_ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
  }

  return {
    email,
    full_name: fullName,
    password,
    phone,
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

  const email = validateEmailField(
    data.email,
    false,
    UserErrorCode.EMAIL_REQUIRED,
    UserErrorCode.EMAIL_INVALID
  );
  const fullName = validateFullNameField(data.full_name, false);
  const roleId = validateRoleIdField(data.role_id, false);
  const password = validatePasswordField(
    data.password,
    false,
    UserErrorCode.PASSWORD_REQUIRED,
    UserErrorCode.PASSWORD_WEAK,
    PasswordPolicyNumber.MIN_LENGTH
  );

  const result: UpdateUserInput = {};

  if (email !== undefined) {
    result.email = email;
  }

  if (fullName !== undefined) {
    result.full_name = fullName;
  }

  if (roleId !== undefined) {
    result.role_id = roleId;
  }

  if (password !== undefined) {
    result.password = password;
  }

  const phone = validatePhoneField(data.phone, false);
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

