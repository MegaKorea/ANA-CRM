import { AppError } from '@/errors';
import {
  HttpStatusCode,
  PaymentMethod,
  PaymentTicketErrorCode,
  TicketStatus,
  ValidationPattern,
} from '@/constants/enums';

export interface CreatePaymentTicketInput {
  lead_id: number;
  enrollment_id?: number;
  course_id?: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date?: string;
  recipient_account?: string;
  images?: string[];
  note?: string;
  created_by?: string;
  status?: 'pending' | 'approved';
}

export interface ReviewPaymentTicketInput {
  status: 'approved' | 'rejected';
  reject_reason?: string;
}

export interface UpdatePaymentTicketInput {
  course_id?: string | null;
  amount?: number;
  payment_method?: PaymentMethod;
  recipient_account?: string | null;
}

export interface PaymentTicketQueryParams {
  lead_id?: number;
  status?: TicketStatus;
  date?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export function validatePaymentTicketId(id: unknown): number {
  if (typeof id !== 'string' && typeof id !== 'number') {
    throw new AppError(PaymentTicketErrorCode.INVALID_ID, HttpStatusCode.BAD_REQUEST);
  }

  const numericId = typeof id === 'string' ? Number.parseInt(id, 10) : id;

  if (Number.isNaN(numericId) || numericId <= 0) {
    throw new AppError(PaymentTicketErrorCode.INVALID_ID, HttpStatusCode.BAD_REQUEST);
  }

  return numericId;
}

export function validateCreatePaymentTicketInput(input: unknown): CreatePaymentTicketInput {
  if (!input || typeof input !== 'object') {
    throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const data = input as Record<string, unknown>;

  // lead_id — required
  if (data.lead_id === undefined || data.lead_id === null) {
    throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }
  const leadId = Number(data.lead_id);
  if (Number.isNaN(leadId) || leadId <= 0) {
    throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  // enrollment_id — optional
  let enrollmentId: number | undefined;
  if (data.enrollment_id !== undefined && data.enrollment_id !== null) {
    enrollmentId = Number(data.enrollment_id);
    if (Number.isNaN(enrollmentId) || enrollmentId <= 0) {
      throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
    }
  }

  // course_id — optional uuid
  let courseId: string | undefined;
  if (data.course_id !== undefined && data.course_id !== null) {
    if (typeof data.course_id !== 'string' || !new RegExp(ValidationPattern.UUID, 'i').test(data.course_id)) {
      throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
    }
    courseId = data.course_id;
  }

  // amount — required, positive
  if (data.amount === undefined || data.amount === null) {
    throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }
  const amount = Number(data.amount);
  if (Number.isNaN(amount) || amount <= 0) {
    throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  // payment_method — required, must be valid
  if (!data.payment_method || typeof data.payment_method !== 'string') {
    throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }
  if (!Object.values(PaymentMethod).includes(data.payment_method as PaymentMethod)) {
    throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  // payment_date — optional
  let paymentDate: string | undefined;
  if (data.payment_date !== undefined && data.payment_date !== null) {
    if (typeof data.payment_date !== 'string') {
      throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
    }
    const d = new Date(data.payment_date);
    if (Number.isNaN(d.getTime())) {
      throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
    }
    paymentDate = data.payment_date;
  }

  // recipient_account — optional
  let recipientAccount: string | undefined;
  if (data.recipient_account !== undefined && data.recipient_account !== null) {
    if (typeof data.recipient_account !== 'string') {
      throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
    }
    recipientAccount = data.recipient_account.trim() || undefined;
  }

  // images — optional string array
  let images: string[] | undefined;
  if (data.images !== undefined && data.images !== null) {
    if (!Array.isArray(data.images)) {
      throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
    }
    images = data.images.filter((img): img is string => typeof img === 'string' && img.trim().length > 0);
  }

  // note — optional
  let note: string | undefined;
  if (data.note !== undefined && data.note !== null) {
    if (typeof data.note !== 'string') {
      throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
    }
    const trimmed = data.note.trim();
    if (trimmed) note = trimmed;
  }

  // created_by — optional uuid
  let createdBy: string | undefined;
  if (data.created_by !== undefined && data.created_by !== null) {
    if (typeof data.created_by !== 'string') {
      throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
    }
    createdBy = data.created_by.trim() || undefined;
  }

  // status — optional, only 'pending' (default) or 'approved' at creation time
  let status: 'pending' | 'approved' | undefined;
  if (data.status !== undefined && data.status !== null) {
    if (data.status !== 'pending' && data.status !== 'approved') {
      throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
    }
    status = data.status;
  }

  return {
    lead_id: leadId,
    enrollment_id: enrollmentId,
    course_id: courseId,
    amount,
    payment_method: data.payment_method as PaymentMethod,
    payment_date: paymentDate,
    recipient_account: recipientAccount,
    images,
    note,
    created_by: createdBy,
    status,
  };
}

export function validateReviewPaymentTicketInput(input: unknown): ReviewPaymentTicketInput {
  if (!input || typeof input !== 'object') {
    throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const data = input as Record<string, unknown>;

  // status — required
  if (!data.status || typeof data.status !== 'string') {
    throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }
  if (data.status !== 'approved' && data.status !== 'rejected') {
    throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  // reject_reason — required if rejected
  let rejectReason: string | undefined;
  if (data.status === 'rejected') {
    if (!data.reject_reason || typeof data.reject_reason !== 'string' || !data.reject_reason.trim()) {
      throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
    }
    rejectReason = data.reject_reason.trim();
  }

  return {
    status: data.status as 'approved' | 'rejected',
    reject_reason: rejectReason,
  };
}

export function validateUpdatePaymentTicketInput(input: unknown): UpdatePaymentTicketInput {
  if (!input || typeof input !== 'object') {
    throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  const data = input as Record<string, unknown>;
  const result: UpdatePaymentTicketInput = {};

  if (data.course_id !== undefined) {
    if (data.course_id === null) {
      result.course_id = null;
    } else if (typeof data.course_id === 'string' && new RegExp(ValidationPattern.UUID, 'i').test(data.course_id)) {
      result.course_id = data.course_id;
    } else {
      throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
    }
  }

  if (data.amount !== undefined) {
    const amount = Number(data.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
    }
    result.amount = amount;
  }

  if (data.payment_method !== undefined) {
    if (!Object.values(PaymentMethod).includes(data.payment_method as PaymentMethod)) {
      throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
    }
    result.payment_method = data.payment_method as PaymentMethod;
  }

  if (data.recipient_account !== undefined) {
    if (data.recipient_account === null) {
      result.recipient_account = null;
    } else if (typeof data.recipient_account === 'string') {
      result.recipient_account = data.recipient_account.trim() || null;
    } else {
      throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
    }
  }

  return result;
}
