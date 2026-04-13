import { createAdminClient } from '@/lib/supabase/admin';
import { handleServiceError, handleSupabaseError, validateDataExists } from '@/lib/utils/error-handler';
import { PaymentTicketErrorCode } from '@/constants/enums';
import type {
  CreatePaymentTicketInput,
  ReviewPaymentTicketInput,
  PaymentTicketQueryParams,
} from '@/lib/validators/payment-ticket.validator';
import type { PaymentTicketsTable } from '@/lib/supabase/types/tables/payment_tickets';
import type { InsertTables, UpdateTables } from '@/types/supabase';

export type PaymentTicket = PaymentTicketsTable['Row'];

export interface PaginatedPaymentTickets {
  data: PaymentTicket[];
  total: number;
}

export interface PaymentSummary {
  total_paid: number;
  ticket_count: number;
  tuition_fee: number;
}

export async function fetchPaymentTickets(
  params?: PaymentTicketQueryParams
): Promise<PaginatedPaymentTickets> {
  try {
    const supabase = createAdminClient();
    let query = supabase.from('payment_tickets').select('*', { count: 'exact' });

    if (params?.lead_id) {
      query = query.eq('lead_id', params.lead_id);
    }

    if (params?.status) {
      query = query.eq('status', params.status);
    }

    // Filter by specific date (payment_date within that day)
    if (params?.date) {
      const dayStart = `${params.date}T00:00:00.000Z`;
      const dayEnd = `${params.date}T23:59:59.999Z`;
      query = query.gte('payment_date', dayStart).lte('payment_date', dayEnd);
    }

    if (params?.startDate) {
      query = query.gte('payment_date', params.startDate);
    }

    if (params?.endDate) {
      const endOfDay = params.endDate.includes('T')
        ? params.endDate
        : `${params.endDate}T23:59:59.999Z`;
      query = query.lte('payment_date', endOfDay);
    }

    query = query.order('created_at', { ascending: false });

    if (params?.page && params?.limit) {
      const from = (params.page - 1) * params.limit;
      const to = from + params.limit - 1;
      query = query.range(from, to);
    }

    const { data, count, error } = await query;
    if (error) {
      handleSupabaseError(error, {
        defaultErrorCode: PaymentTicketErrorCode.FETCH_FAILED,
      });
    }

    return {
      data: (data as unknown as PaymentTicket[]) || [],
      total: count ?? 0,
    };
  } catch (error) {
    handleServiceError(error, PaymentTicketErrorCode.FETCH_FAILED);
  }
}

export async function fetchPaymentTicketsByLeadId(
  leadId: number
): Promise<PaymentTicket[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('payment_tickets')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) {
      handleSupabaseError(error, {
        defaultErrorCode: PaymentTicketErrorCode.FETCH_FAILED,
      });
    }

    return (data as unknown as PaymentTicket[]) || [];
  } catch (error) {
    handleServiceError(error, PaymentTicketErrorCode.FETCH_FAILED);
  }
}

export async function createPaymentTicket(
  input: CreatePaymentTicketInput
): Promise<PaymentTicket> {
  try {
    const supabase = createAdminClient();

    const insertData: InsertTables<'payment_tickets'> = {
      lead_id: input.lead_id,
      amount: input.amount,
      payment_type: input.payment_type,
      payment_date: input.payment_date ?? new Date().toISOString(),
      images: input.images ?? [],
      note: input.note ?? null,
      status: 'pending',
      created_by: input.created_by ?? null,
    };

    const { data, error } = await supabase
      .from('payment_tickets')
      .insert(insertData as never)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, {
        defaultErrorCode: PaymentTicketErrorCode.CREATE_FAILED,
      });
    }

    return data as PaymentTicket;
  } catch (error) {
    handleServiceError(error, PaymentTicketErrorCode.CREATE_FAILED);
  }
}

export async function reviewPaymentTicket(
  id: number,
  input: ReviewPaymentTicketInput
): Promise<PaymentTicket> {
  try {
    const supabase = createAdminClient();

    // Check if ticket exists and is still pending
    const { data: existing, error: fetchError } = await supabase
      .from('payment_tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      handleSupabaseError(fetchError, {
        notFoundErrorCode: PaymentTicketErrorCode.NOT_FOUND,
        defaultErrorCode: PaymentTicketErrorCode.NOT_FOUND,
      });
    }

    const ticket = existing as unknown as PaymentTicket;
    if (ticket.status !== 'pending') {
      const { AppError } = await import('@/errors');
      throw new AppError(PaymentTicketErrorCode.ALREADY_REVIEWED, 400);
    }

    const updateData: UpdateTables<'payment_tickets'> = {
      status: input.status as never,
      reviewed_by: input.reviewed_by ?? null,
      reviewed_at: new Date().toISOString(),
      reject_reason: input.reject_reason ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('payment_tickets')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, {
        defaultErrorCode: PaymentTicketErrorCode.UPDATE_FAILED,
      });
    }

    return validateDataExists(
      data as unknown as PaymentTicket,
      PaymentTicketErrorCode.NOT_FOUND
    );
  } catch (error) {
    handleServiceError(error, PaymentTicketErrorCode.UPDATE_FAILED);
  }
}

export async function getLeadPaymentSummary(
  leadId: number
): Promise<PaymentSummary> {
  try {
    const supabase = createAdminClient();

    // Get approved tickets total
    const { data: tickets, error: ticketsError } = await supabase
      .from('payment_tickets')
      .select('amount')
      .eq('lead_id', leadId)
      .eq('status', 'approved');

    if (ticketsError) {
      handleSupabaseError(ticketsError, {
        defaultErrorCode: PaymentTicketErrorCode.FETCH_FAILED,
      });
    }

    const approvedTickets = (tickets as unknown as { amount: number }[]) || [];
    const totalPaid = approvedTickets.reduce((sum, t) => sum + t.amount, 0);

    // Get tuition_fee from lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('tuition_fee')
      .eq('id', leadId)
      .single();

    if (leadError) {
      handleSupabaseError(leadError, {
        defaultErrorCode: PaymentTicketErrorCode.FETCH_FAILED,
      });
    }

    const leadData = lead as unknown as { tuition_fee: number | null };

    return {
      total_paid: totalPaid,
      ticket_count: approvedTickets.length,
      tuition_fee: leadData?.tuition_fee ?? 0,
    };
  } catch (error) {
    handleServiceError(error, PaymentTicketErrorCode.FETCH_FAILED);
  }
}
