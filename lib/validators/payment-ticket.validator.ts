import { AppError } from '@/errors';
import { HttpStatusCode, PaymentTicketErrorCode, PaymentType, TicketStatus } from '@/constants/enums';

export interface CreatePaymentTicketInput {
  lead_id: number;
  amount: number;
  payment_type: PaymentType;
  payment_date?: string;
  images?: string[];
  note?: string;
  created_by?: string;
}

export interface ReviewPaymentTicketInput {
  status: 'approved' | 'rejected';
  reviewed_by?: string;
  reject_reason?: string;
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

  // amount — required, positive
  if (data.amount === undefined || data.amount === null) {
    throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }
  const amount = Number(data.amount);
  if (Number.isNaN(amount) || amount <= 0) {
    throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }

  // payment_type — required, must be valid
  if (!data.payment_type || typeof data.payment_type !== 'string') {
    throw new AppError(PaymentTicketErrorCode.BAD_REQUEST, HttpStatusCode.BAD_REQUEST);
  }
  if (!Object.values(PaymentType).includes(data.payment_type as PaymentType)) {
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

  return {
    lead_id: leadId,
    amount,
    payment_type: data.payment_type as PaymentType,
    payment_date: paymentDate,
    images,
    note,
    created_by: createdBy,
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

  // reviewed_by — optional
  let reviewedBy: string | undefined;
  if (data.reviewed_by !== undefined && data.reviewed_by !== null && typeof data.reviewed_by === 'string') {
    reviewedBy = data.reviewed_by.trim() || undefined;
  }

  return {
    status: data.status as 'approved' | 'rejected',
    reviewed_by: reviewedBy,
    reject_reason: rejectReason,
  };
}
