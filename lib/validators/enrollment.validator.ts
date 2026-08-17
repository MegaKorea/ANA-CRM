import { AppError } from '@/errors';
import { EnrollmentErrorCode, HttpStatusCode, ValidationPattern } from '@/constants/enums';

export const ENROLLMENT_CATEGORIES = ['khóa học', 'vật tư', 'chứng chỉ'] as const;
export type EnrollmentCategory = (typeof ENROLLMENT_CATEGORIES)[number];

const DEFAULT_ENROLLMENT_CATEGORY: EnrollmentCategory = 'khóa học';

export interface CreateEnrollmentInput {
  lead_id: number;
  category: EnrollmentCategory;
  course_id?: string;
  class_id?: string;
  item_name?: string;
  enrollment_date?: string;
  sales_month: string;
  source?: string;
  expected_study_month?: string;
  tuition_fee?: number;
  deposit_amount?: number;
  debt_note?: string;
  note?: string;
  created_by?: string;
}

export interface UpdateEnrollmentInput {
  category?: EnrollmentCategory;
  course_id?: string | null;
  class_id?: string | null;
  item_name?: string | null;
  enrollment_date?: string;
  sales_month?: string;
  source?: string | null;
  expected_study_month?: string | null;
  tuition_fee?: number;
  deposit_amount?: number;
  debt_note?: string | null;
  note?: string | null;
  created_by?: string | null;
}

export interface EnrollmentQueryParams {
  lead_id?: number;
  course_id?: string;
  class_id?: string;
  sales_month?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export function validateEnrollmentId(id: unknown): number {
  if (typeof id !== 'string' && typeof id !== 'number') {
    throw new AppError(EnrollmentErrorCode.INVALID_ID, HttpStatusCode.BAD_REQUEST);
  }

  const numericId = typeof id === 'string' ? Number.parseInt(id, 10) : id;

  if (Number.isNaN(numericId) || numericId <= 0) {
    throw new AppError(EnrollmentErrorCode.INVALID_ID, HttpStatusCode.BAD_REQUEST);
  }

  return numericId;
}

function validateRequiredUuidField(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(EnrollmentErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const trimmedValue = value.trim();
  const uuidRegex = new RegExp(ValidationPattern.UUID, 'i');
  if (!uuidRegex.test(trimmedValue)) {
    throw new AppError(EnrollmentErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  return trimmedValue;
}

function validateOptionalUuidField(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return validateRequiredUuidField(value);
}

function validateOptionalStringField(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new AppError(EnrollmentErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }
  const trimmedValue = value.trim();
  return trimmedValue || undefined;
}

function validateCategoryField(value: unknown): EnrollmentCategory {
  if (typeof value !== 'string' || !ENROLLMENT_CATEGORIES.includes(value as EnrollmentCategory)) {
    throw new AppError(
      EnrollmentErrorCode.BAD_REQUEST,
      HttpStatusCode.BAD_REQUEST,
      `category phải là một trong: ${ENROLLMENT_CATEGORIES.join(', ')}`,
    );
  }
  return value as EnrollmentCategory;
}

function validateRequiredItemNameField(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError(
      EnrollmentErrorCode.BAD_REQUEST,
      HttpStatusCode.BAD_REQUEST,
      'item_name không được để trống khi category không phải khóa học',
    );
  }
  return value.trim();
}

function validateOptionalDateField(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new AppError(EnrollmentErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(EnrollmentErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }
  return value;
}

function validateSalesMonthField(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value !== 'string' || !/^\d{4}-\d{2}$/.test(value)) {
    throw new AppError(EnrollmentErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST, "sales_month phải dạng 'YYYY-MM'");
  }
  return value;
}

function validateAmountField(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const numericValue = Number(value);
  if (Number.isNaN(numericValue) || numericValue < 0) {
    throw new AppError(EnrollmentErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }
  return numericValue;
}

function deriveSalesMonth(explicit: string | undefined, enrollmentDate: string | undefined): string {
  if (explicit) return explicit;
  const base = enrollmentDate ? new Date(enrollmentDate) : new Date();
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function validateCreateEnrollmentInput(input: unknown): CreateEnrollmentInput {
  if (!input || typeof input !== 'object') {
    throw new AppError(EnrollmentErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const data = input as Record<string, unknown>;

  if (data.lead_id === undefined || data.lead_id === null) {
    throw new AppError(EnrollmentErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }
  const leadId = Number(data.lead_id);
  if (Number.isNaN(leadId) || leadId <= 0) {
    throw new AppError(EnrollmentErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const category = validateCategoryField(data.category ?? DEFAULT_ENROLLMENT_CATEGORY);
  const isCourse = category === DEFAULT_ENROLLMENT_CATEGORY;
  const courseId = isCourse ? validateRequiredUuidField(data.course_id) : undefined;
  const itemName = isCourse ? undefined : validateRequiredItemNameField(data.item_name);
  const enrollmentDate = validateOptionalDateField(data.enrollment_date);

  return {
    lead_id: leadId,
    category,
    course_id: courseId,
    class_id: isCourse ? validateOptionalUuidField(data.class_id) : undefined,
    item_name: itemName,
    enrollment_date: enrollmentDate,
    sales_month: deriveSalesMonth(validateSalesMonthField(data.sales_month), enrollmentDate),
    source: validateOptionalStringField(data.source),
    expected_study_month: validateOptionalStringField(data.expected_study_month),
    tuition_fee: validateAmountField(data.tuition_fee),
    deposit_amount: validateAmountField(data.deposit_amount),
    debt_note: validateOptionalStringField(data.debt_note),
    note: validateOptionalStringField(data.note),
    created_by: validateOptionalStringField(data.created_by),
  };
}

export function validateUpdateEnrollmentInput(input: unknown): UpdateEnrollmentInput {
  if (!input || typeof input !== 'object') {
    throw new AppError(EnrollmentErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const data = input as Record<string, unknown>;
  const result: UpdateEnrollmentInput = {};

  if (data.category !== undefined) {
    result.category = validateCategoryField(data.category);
  }

  if (data.course_id !== undefined) {
    result.course_id = data.course_id === null ? null : validateRequiredUuidField(data.course_id);
  }

  if (data.class_id !== undefined) {
    result.class_id = data.class_id === null ? null : validateRequiredUuidField(data.class_id);
  }

  if (data.item_name !== undefined) {
    result.item_name = data.item_name === null ? null : validateOptionalStringField(data.item_name) ?? null;
  }

  const enrollmentDate = validateOptionalDateField(data.enrollment_date);
  if (enrollmentDate !== undefined) result.enrollment_date = enrollmentDate;

  const salesMonth = validateSalesMonthField(data.sales_month);
  if (salesMonth !== undefined) result.sales_month = salesMonth;

  if (data.source !== undefined) {
    result.source = data.source === null ? null : validateOptionalStringField(data.source) ?? null;
  }

  if (data.expected_study_month !== undefined) {
    result.expected_study_month =
      data.expected_study_month === null ? null : validateOptionalStringField(data.expected_study_month) ?? null;
  }

  const tuitionFee = validateAmountField(data.tuition_fee);
  if (tuitionFee !== undefined) result.tuition_fee = tuitionFee;

  const depositAmount = validateAmountField(data.deposit_amount);
  if (depositAmount !== undefined) result.deposit_amount = depositAmount;

  if (data.debt_note !== undefined) {
    result.debt_note = data.debt_note === null ? null : validateOptionalStringField(data.debt_note) ?? null;
  }

  if (data.note !== undefined) {
    result.note = data.note === null ? null : validateOptionalStringField(data.note) ?? null;
  }

  if (data.created_by !== undefined) {
    if (data.created_by === null) {
      result.created_by = null;
    } else {
      const createdBy = validateOptionalStringField(data.created_by);
      if (!createdBy) {
        throw new AppError(EnrollmentErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
      }
      result.created_by = createdBy;
    }
  }

  return result;
}
