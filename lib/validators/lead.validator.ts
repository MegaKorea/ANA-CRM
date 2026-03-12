import { AppError } from '@/errors';
import { HttpStatusCode, LeadErrorCode, LeadStatus, AttendanceStatus, ValidationPattern } from '@/constants/enums';
import { validateEmailField } from '@/lib/utils/validation';
import { formatPhoneToE164, validateE164Format, formatPhoneToLocal } from '@/lib/utils/phone';
import type { LocationValue } from '@/components/common';
import type { NoteItem } from '@/types/tables/leads';

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
  note?: NoteItem[];
  course_ids?: string[];
  sales_amount?: number | null;
  deposit?: number | null;
  outstanding_balance?: number | null;
  appointment_date?: string | null;
  attendance_status?: AttendanceStatus;
  images?: string[];
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
  note?: NoteItem[];
  course_ids?: string[];
  sales_amount?: number | null;
  deposit?: number | null;
  outstanding_balance?: number | null;
  appointment_date?: string | null;
  attendance_status?: AttendanceStatus;
  images?: string[];
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

function validateOptionalDateField(value: unknown): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new AppError(LeadErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
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

function validateOptionalUuidArrayField(value: unknown): string[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new AppError(LeadErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const uuidRegex = new RegExp(ValidationPattern.UUID, 'i');
  const result: string[] = [];

  for (const item of value) {
    if (typeof item !== 'string') {
      throw new AppError(LeadErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
    }
    const trimmedItem = item.trim();
    if (!uuidRegex.test(trimmedItem)) {
      throw new AppError(LeadErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
    }
    result.push(trimmedItem);
  }

  return result.length > 0 ? result : undefined;
}

function validateOptionalNumberField(value: unknown): number | null | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value === null || value === '') {
    return null;
  }

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    throw new AppError(LeadErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  return numericValue;
}

function validateOptionalStringArrayField(value: unknown): string[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new AppError(LeadErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const result: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') {
      throw new AppError(LeadErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
    }
    const trimmedItem = item.trim();
    if (trimmedItem) {
      result.push(trimmedItem);
    }
  }

  return result.length > 0 ? result : undefined;
}

function validateOptionalNoteArrayField(value: unknown): NoteItem[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    throw new AppError(LeadErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const result: NoteItem[] = [];
  for (const item of value) {
    if (typeof item !== 'object' || item === null) {
      throw new AppError(LeadErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
    }
    const noteItem = item as Record<string, unknown>;
    if (typeof noteItem.content !== 'string' || !noteItem.content.trim()) {
      throw new AppError(LeadErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
    }
    if (typeof noteItem.created_at !== 'string') {
      throw new AppError(LeadErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
    }
    result.push({
      content: noteItem.content.trim(),
      created_at: noteItem.created_at,
    });
  }

  return result.length > 0 ? result : undefined;
}

function validateStatusField(value: unknown): LeadStatus | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new AppError(LeadErrorCode.STATUS_INVALID, HttpStatusCode.BAD_REQUEST);
  }

  if (Object.values(LeadStatus).includes(value as LeadStatus)) {
    return value as LeadStatus;
  }

  throw new AppError(LeadErrorCode.STATUS_INVALID, HttpStatusCode.BAD_REQUEST);
}

function validateAttendanceStatusField(value: unknown): AttendanceStatus | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new AppError(LeadErrorCode.STATUS_INVALID, HttpStatusCode.BAD_REQUEST);
  }

  if (Object.values(AttendanceStatus).includes(value as AttendanceStatus)) {
    return value as AttendanceStatus;
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

  return formatPhoneToLocal(formattedPhone);
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
    date_of_birth: validateOptionalStringField(data.date_of_birth),
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
    note: validateOptionalNoteArrayField(data.note),
    course_ids: validateOptionalUuidArrayField(data.course_ids),
    sales_amount: validateOptionalNumberField(data.sales_amount),
    deposit: validateOptionalNumberField(data.deposit),
    outstanding_balance: validateOptionalNumberField(data.outstanding_balance),
    appointment_date: validateOptionalDateField(data.appointment_date),
    attendance_status: validateAttendanceStatusField(data.attendance_status),
    images: validateOptionalStringArrayField(data.images),
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

  const dateOfBirth = validateOptionalStringField(data.date_of_birth);
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
  const note = validateOptionalNoteArrayField(data.note);
  const courseIds = validateOptionalUuidArrayField(data.course_ids);
  const salesAmount = validateOptionalNumberField(data.sales_amount);
  const deposit = validateOptionalNumberField(data.deposit);
  const outstandingBalance = validateOptionalNumberField(data.outstanding_balance);
  const appointmentDate = validateOptionalDateField(data.appointment_date);
  const attendanceStatus = validateAttendanceStatusField(data.attendance_status);
  const images = validateOptionalStringArrayField(data.images);

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

  if (courseIds !== undefined) {
    result.course_ids = courseIds;
  }

  if (salesAmount !== undefined) {
    result.sales_amount = salesAmount;
  }

  if (deposit !== undefined) {
    result.deposit = deposit;
  }

  if (outstandingBalance !== undefined) {
    result.outstanding_balance = outstandingBalance;
  }

  if (appointmentDate !== undefined) {
    result.appointment_date = appointmentDate;
  }

  if (attendanceStatus !== undefined) {
    result.attendance_status = attendanceStatus;
  }

  if (images !== undefined) {
    result.images = images;
  }

  return result;
}
