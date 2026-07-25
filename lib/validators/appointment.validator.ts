import { AppError } from '@/errors';
import { AppointmentErrorCode, AttendanceStatus, HttpStatusCode } from '@/constants/enums';

/** Reminder offsets offered in the UI, in minutes. */
export const REMIND_BEFORE_OPTIONS = [15, 30, 60, 120, 1440] as const;

export interface CreateAppointmentInput {
  lead_id: number;
  appointment_date: string;
  attendance_status?: AttendanceStatus;
  note?: string;
  remind_before_min?: number;
  created_by?: string;
}

export interface UpdateAppointmentInput {
  appointment_date?: string;
  attendance_status?: AttendanceStatus;
  note?: string | null;
  remind_before_min?: number;
  reminder_sent_at?: string | null;
}

export function validateAppointmentId(id: unknown): number {
  if (typeof id !== 'string' && typeof id !== 'number') {
    throw new AppError(AppointmentErrorCode.INVALID_ID, HttpStatusCode.BAD_REQUEST);
  }

  const numericId = typeof id === 'string' ? Number.parseInt(id, 10) : id;

  if (Number.isNaN(numericId) || numericId <= 0) {
    throw new AppError(AppointmentErrorCode.INVALID_ID, HttpStatusCode.BAD_REQUEST);
  }

  return numericId;
}

function validateDateField(value: unknown, isRequired: boolean): string | undefined {
  if (value === undefined || value === null || value === '') {
    if (isRequired) {
      throw new AppError(AppointmentErrorCode.DATE_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new AppError(AppointmentErrorCode.DATE_INVALID, HttpStatusCode.BAD_REQUEST);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(AppointmentErrorCode.DATE_INVALID, HttpStatusCode.BAD_REQUEST);
  }

  return date.toISOString();
}

function validateRemindBeforeField(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const minutes = Number(value);
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 10080) {
    // Cap at one week so a typo cannot schedule a reminder far in the past.
    throw new AppError(AppointmentErrorCode.REMIND_BEFORE_INVALID, HttpStatusCode.BAD_REQUEST);
  }

  return minutes;
}

function validateAttendanceStatusField(value: unknown): AttendanceStatus | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string' || !Object.values(AttendanceStatus).includes(value as AttendanceStatus)) {
    throw new AppError(AppointmentErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  return value as AttendanceStatus;
}

function validateNoteField(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new AppError(AppointmentErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  return value.trim() || undefined;
}

export function validateCreateAppointmentInput(input: unknown): CreateAppointmentInput {
  if (!input || typeof input !== 'object') {
    throw new AppError(AppointmentErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const data = input as Record<string, unknown>;

  const leadId = Number(data.lead_id);
  if (Number.isNaN(leadId) || leadId <= 0) {
    throw new AppError(AppointmentErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const appointmentDate = validateDateField(data.appointment_date, true);
  if (!appointmentDate) {
    throw new AppError(AppointmentErrorCode.DATE_REQUIRED, HttpStatusCode.BAD_REQUEST);
  }

  let createdBy: string | undefined;
  if (typeof data.created_by === 'string') {
    createdBy = data.created_by.trim() || undefined;
  }

  return {
    lead_id: leadId,
    appointment_date: appointmentDate,
    attendance_status: validateAttendanceStatusField(data.attendance_status),
    note: validateNoteField(data.note),
    remind_before_min: validateRemindBeforeField(data.remind_before_min),
    created_by: createdBy,
  };
}

export function validateUpdateAppointmentInput(input: unknown): UpdateAppointmentInput {
  if (!input || typeof input !== 'object') {
    throw new AppError(AppointmentErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const data = input as Record<string, unknown>;
  const result: UpdateAppointmentInput = {};

  const appointmentDate = validateDateField(data.appointment_date, false);
  if (appointmentDate !== undefined) {
    result.appointment_date = appointmentDate;
  }

  const attendanceStatus = validateAttendanceStatusField(data.attendance_status);
  if (attendanceStatus !== undefined) {
    result.attendance_status = attendanceStatus;
  }

  // Note is explicitly nullable so staff can clear it.
  if (data.note !== undefined) {
    result.note = data.note === null ? null : (validateNoteField(data.note) ?? null);
  }

  const remindBefore = validateRemindBeforeField(data.remind_before_min);
  if (remindBefore !== undefined) {
    result.remind_before_min = remindBefore;
  }

  // Used by the reminder poller to mark a reminder as delivered (or to re-arm it).
  if (data.reminder_sent_at !== undefined) {
    result.reminder_sent_at =
      data.reminder_sent_at === null ? null : validateDateField(data.reminder_sent_at, false) ?? null;
  }

  return result;
}
