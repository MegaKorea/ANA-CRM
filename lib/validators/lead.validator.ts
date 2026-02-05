import { AppError } from '@/errors';
import { HttpStatusCode, LeadErrorCode, LeadStatus, ValidationPattern } from '@/constants/enums';
import { validateEmailField } from '@/lib/utils/validation';
import { formatPhoneToE164, validateE164Format } from '@/lib/utils/phone';
import type { LocationValue } from '@/components/common';

export interface CreateLeadInput {
  email?: string;
  phone_number?: string;
  full_name: string;
  date_of_birth?: string;
  place_of_birth?: LocationValue;
  place_of_origin?: LocationValue;
  current_address?: LocationValue;
  citizen_id?: string;
  nationality?: string;
  ethnicity?: string;
  meta_data?: Record<string, unknown>;
  source?: string;
  telesales_id?: string;
  status?: LeadStatus;
  note?: string;
}

export interface UpdateLeadInput {
  email?: string;
  phone_number?: string;
  full_name?: string;
  date_of_birth?: string;
  place_of_birth?: LocationValue;
  place_of_origin?: LocationValue;
  current_address?: LocationValue;
  citizen_id?: string;
  nationality?: string;
  ethnicity?: string;
  meta_data?: Record<string, unknown>;
  source?: string;
  telesales_id?: string;
  status?: LeadStatus;
  note?: string;
}

export function validateLeadId(id: unknown): number {
  if (typeof id !== 'string' && typeof id !== 'number') {
    throw new AppError(LeadErrorCode.INVALID_ID, HttpStatusCode.BAD_REQUEST);
  }

  const numericId = typeof id === 'string' ? Number.parseInt(id, 10) : id;

  if (Number.isNaN(numericId) || numericId <= 0) {
    throw new AppError(LeadErrorCode.INVALID_ID, HttpStatusCode.BAD_REQUEST);
  }

  return numericId;
}

function validateOptionalStringField(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new AppError(LeadErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  return trimmedValue;
}

function validateOptionalDateField(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new AppError(LeadErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  const date = new Date(trimmedValue);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(LeadErrorCode.DATE_OF_BIRTH_INVALID, HttpStatusCode.BAD_REQUEST);
  }

  return trimmedValue;
}

function validateOptionalUuidField(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new AppError(LeadErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  const uuidRegex = new RegExp(ValidationPattern.UUID, 'i');
  if (!uuidRegex.test(trimmedValue)) {
    throw new AppError(LeadErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  return trimmedValue;
}

function validateOptionalJsonField(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError(LeadErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  return value as Record<string, unknown>;
}

function validateOptionalLocationField(value: unknown): LocationValue | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new AppError(LeadErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  return value as LocationValue;
}

function validateStatusField(value: unknown): LeadStatus | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new AppError(LeadErrorCode.STATUS_INVALID, HttpStatusCode.BAD_REQUEST);
  }

  if (value === LeadStatus.NEW) {
    return LeadStatus.NEW;
  }

  if (value === LeadStatus.CONTACTED) {
    return LeadStatus.CONTACTED;
  }

  if (value === LeadStatus.QUALIFIED) {
    return LeadStatus.QUALIFIED;
  }

  if (value === LeadStatus.CONVERTED) {
    return LeadStatus.CONVERTED;
  }

  if (value === LeadStatus.LOST) {
    return LeadStatus.LOST;
  }

  throw new AppError(LeadErrorCode.STATUS_INVALID, HttpStatusCode.BAD_REQUEST);
}

function validateFullNameField(value: unknown, isRequired: boolean): string | undefined {
  if (value === undefined || value === null) {
    if (isRequired) {
      throw new AppError(LeadErrorCode.FULL_NAME_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new AppError(LeadErrorCode.FULL_NAME_REQUIRED, HttpStatusCode.BAD_REQUEST);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    if (isRequired) {
      throw new AppError(LeadErrorCode.FULL_NAME_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }
    return undefined;
  }

  return trimmedValue;
}

function validatePhoneField(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new AppError(LeadErrorCode.PHONE_INVALID, HttpStatusCode.BAD_REQUEST);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return undefined;
  }

  const formattedPhone = formatPhoneToE164(trimmedValue);

  if (!validateE164Format(formattedPhone)) {
    throw new AppError(LeadErrorCode.PHONE_INVALID, HttpStatusCode.BAD_REQUEST);
  }

  return formattedPhone;
}

export function validateCreateLeadInput(input: unknown): CreateLeadInput {
  if (!input || typeof input !== 'object') {
    throw new AppError(LeadErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const data = input as Record<string, unknown>;

  const email = validateEmailField(
    data.email,
    false,
    LeadErrorCode.EMAIL_INVALID,
    LeadErrorCode.EMAIL_INVALID
  );
  const fullName = validateFullNameField(data.full_name, true);
  const phoneNumber = validatePhoneField(data.phone_number);

  if (!fullName) {
    throw new AppError(LeadErrorCode.FULL_NAME_REQUIRED, HttpStatusCode.BAD_REQUEST);
  }

  return {
    email,
    phone_number: phoneNumber,
    full_name: fullName,
    date_of_birth: validateOptionalDateField(data.date_of_birth),
    place_of_birth: validateOptionalLocationField(data.place_of_birth),
    place_of_origin: validateOptionalLocationField(data.place_of_origin),
    current_address: validateOptionalLocationField(data.current_address),
    citizen_id: validateOptionalStringField(data.citizen_id),
    nationality: validateOptionalStringField(data.nationality),
    ethnicity: validateOptionalStringField(data.ethnicity),
    meta_data: validateOptionalJsonField(data.meta_data),
    source: validateOptionalStringField(data.source),
    telesales_id: validateOptionalUuidField(data.telesales_id),
    status: validateStatusField(data.status),
    note: validateOptionalStringField(data.note),
  };
}

export function validateUpdateLeadInput(input: unknown): UpdateLeadInput {
  if (!input || typeof input !== 'object') {
    throw new AppError(LeadErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const data = input as Record<string, unknown>;

  const email = validateEmailField(
    data.email,
    false,
    LeadErrorCode.EMAIL_INVALID,
    LeadErrorCode.EMAIL_INVALID
  );
  const fullName = validateFullNameField(data.full_name, false);
  const phoneNumber = validatePhoneField(data.phone_number);

  const result: UpdateLeadInput = {};

  if (email !== undefined) {
    result.email = email;
  }

  if (fullName !== undefined) {
    result.full_name = fullName;
  }

  if (phoneNumber !== undefined) {
    result.phone_number = phoneNumber;
  }

  const dateOfBirth = validateOptionalDateField(data.date_of_birth);
  const placeOfBirth = validateOptionalLocationField(data.place_of_birth);
  const placeOfOrigin = validateOptionalLocationField(data.place_of_origin);
  const currentAddress = validateOptionalLocationField(data.current_address);
  const citizenId = validateOptionalStringField(data.citizen_id);
  const nationality = validateOptionalStringField(data.nationality);
  const ethnicity = validateOptionalStringField(data.ethnicity);
  const metaData = validateOptionalJsonField(data.meta_data);
  const source = validateOptionalStringField(data.source);
  const telesalesId = validateOptionalUuidField(data.telesales_id);
  const status = validateStatusField(data.status);
  const note = validateOptionalStringField(data.note);

  if (dateOfBirth !== undefined) {
    result.date_of_birth = dateOfBirth;
  }

  if (placeOfBirth !== undefined) {
    result.place_of_birth = placeOfBirth;
  }

  if (placeOfOrigin !== undefined) {
    result.place_of_origin = placeOfOrigin;
  }

  if (currentAddress !== undefined) {
    result.current_address = currentAddress;
  }

  if (citizenId !== undefined) {
    result.citizen_id = citizenId;
  }

  if (nationality !== undefined) {
    result.nationality = nationality;
  }

  if (ethnicity !== undefined) {
    result.ethnicity = ethnicity;
  }

  if (metaData !== undefined) {
    result.meta_data = metaData;
  }

  if (source !== undefined) {
    result.source = source;
  }

  if (telesalesId !== undefined) {
    result.telesales_id = telesalesId;
  }

  if (status !== undefined) {
    result.status = status;
  }

  if (note !== undefined) {
    result.note = note;
  }

  return result;
}
