import { createAdminClient } from '@/lib/supabase/admin';
import { handleServiceError, handleSupabaseError, validateDataExists } from '@/lib/utils/error-handler';
import { PaymentTicketErrorCode } from '@/constants/enums';
import type {
  CreatePaymentTicketInput,
  ReviewPaymentTicketInput,
  UpdatePaymentTicketInput,
  PaymentTicketQueryParams,
} from '@/lib/validators/payment-ticket.validator';
import type { PaymentTicketsTable } from '@/lib/supabase/types/tables/payment_tickets';
import type { InsertTables, UpdateTables } from '@/types/supabase';

export type PaymentTicket = PaymentTicketsTable['Row'] & {
  lead_full_name?: string | null;
  lead_phone_number?: string | null;
  created_by_name?: string | null;
};

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
    let query = supabase
      .from('payment_tickets')
      .select('*', { count: 'exact' });

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

    const rawTickets = (data as unknown as PaymentTicketsTable['Row'][]) || [];

    // Fetch lead info (full_name, phone) and consultant (created_by) name for all unique ids
    let leadMap: Map<number, { full_name: string | null; phone: string | null }> = new Map();
    let userMap: Map<string, string | null> = new Map();
    if (rawTickets.length > 0) {
      const leadIds = [...new Set(rawTickets.map((t) => t.lead_id))];
      const userIds = [...new Set(rawTickets.map((t) => t.created_by).filter((id): id is string => !!id))];

      const [{ data: leadsData }, { data: usersData }] = await Promise.all([
        supabase.from('leads').select('id, full_name, phone_number').in('id', leadIds),
        userIds.length > 0
          ? supabase.from('users').select('id, full_name').in('id', userIds)
          : Promise.resolve({ data: [] }),
      ]);

      if (leadsData) {
        leadMap = new Map(
          (leadsData as unknown as { id: number; full_name: string | null; phone_number: string | null }[]).map(
            (l) => [l.id, { full_name: l.full_name, phone: l.phone_number }]
          )
        );
      }

      if (usersData) {
        userMap = new Map(
          (usersData as unknown as { id: string; full_name: string | null }[]).map((u) => [u.id, u.full_name])
        );
      }
    }

    // Merge lead + consultant info into tickets
    const flatData: PaymentTicket[] = rawTickets.map((ticket) => {
      const lead = leadMap.get(ticket.lead_id);
      return {
        ...ticket,
        lead_full_name: lead?.full_name ?? null,
        lead_phone_number: lead?.phone ?? null,
        created_by_name: ticket.created_by ? (userMap.get(ticket.created_by) ?? null) : null,
      };
    });

    return {
      data: flatData,
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
  input: CreatePaymentTicketInput,
  actorId: string | null
): Promise<PaymentTicket> {
  try {
    const supabase = createAdminClient();

    const status = input.status ?? 'pending';

    // Course isn't always given explicitly — fall back to the linked enrollment's
    // course, then to the lead's first "khóa học quan tâm" pick.
    let courseId = input.course_id ?? null;
    if (!courseId && input.enrollment_id) {
      const { data: enrollmentRow } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('id', input.enrollment_id)
        .single();
      courseId = (enrollmentRow as { course_id: string } | null)?.course_id ?? null;
    }
    if (!courseId) {
      const { data: leadRow } = await supabase
        .from('leads')
        .select('course_ids')
        .eq('id', input.lead_id)
        .single();
      courseId = (leadRow as { course_ids: string[] | null } | null)?.course_ids?.[0] ?? null;
    }

    const insertData: InsertTables<'payment_tickets'> = {
      lead_id: input.lead_id,
      enrollment_id: input.enrollment_id ?? null,
      course_id: courseId,
      amount: input.amount,
      payment_type: input.payment_type,
      payment_date: input.payment_date ?? new Date().toISOString(),
      recipient_account: input.recipient_account ?? null,
      images: input.images ?? [],
      note: input.note ?? null,
      status,
      created_by: input.created_by ?? null,
      // Self-approved (creator asserts the money is already in hand) — not
      // reviewed by a second person like the normal "Phiếu thu" approval flow.
      // reviewed_by is always the actual authenticated caller (never the
      // client-supplied created_by) so the audit trail can't be forged to
      // attribute the approval to someone else.
      reviewed_by: status === 'approved' ? actorId : null,
      reviewed_at: status === 'approved' ? new Date().toISOString() : null,
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
  input: ReviewPaymentTicketInput,
  actorId: string | null
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
      // Always the actual authenticated caller, never client-supplied — see
      // the same rationale in createPaymentTicket above.
      reviewed_by: actorId,
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

export async function updatePaymentTicket(
  id: number,
  input: UpdatePaymentTicketInput
): Promise<PaymentTicket> {
  try {
    const supabase = createAdminClient();

    const updateData: UpdateTables<'payment_tickets'> = {
      updated_at: new Date().toISOString(),
    };
    if (input.course_id !== undefined) {
      updateData.course_id = input.course_id;
    }

    const { data, error } = await supabase
      .from('payment_tickets')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, {
        notFoundErrorCode: PaymentTicketErrorCode.NOT_FOUND,
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
