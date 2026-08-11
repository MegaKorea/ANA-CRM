import { createAdminClient } from '@/lib/supabase/admin';
import { handleServiceError, handleSupabaseError, validateDataExists } from '@/lib/utils/error-handler';
import { EnrollmentErrorCode, LeadStatus } from '@/constants/enums';
import { SMAX_SUPPORTER_DIRECTORY } from '@/constants/smax';
import type {
  CreateEnrollmentInput,
  UpdateEnrollmentInput,
  EnrollmentQueryParams,
} from '@/lib/validators/enrollment.validator';
import { EnrollmentsTable } from '../supabase/types/tables/enrollments';
import type { InsertTables, UpdateTables } from '@/types/supabase';

export type Enrollment = EnrollmentsTable['Row'] & {
  lead_full_name?: string | null;
  lead_phone_number?: string | null;
  created_by_name?: string | null;
};

export interface PaginatedEnrollments {
  data: Enrollment[];
  total: number;  
}

export async function fetchEnrolledLeadIds(): Promise<number[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('enrollments').select('lead_id');

    if (error) {
      handleSupabaseError(error, {
        defaultErrorCode: EnrollmentErrorCode.FETCH_FAILED,
      });
    }

    return ((data as unknown as { lead_id: number }[]) || []).map((row) => row.lead_id);
  } catch (error) {
    handleServiceError(error, EnrollmentErrorCode.FETCH_FAILED);
  }
}

export async function fetchAllEnrollments(params?: EnrollmentQueryParams): Promise<PaginatedEnrollments> {
  try {
    const supabase = createAdminClient();
    let query = supabase.from('enrollments').select('*', { count: 'exact' });

    if (params?.lead_id) {
      query = query.eq('lead_id', params.lead_id);
    }

    if (params?.course_id) {
      query = query.eq('course_id', params.course_id);
    }

    if (params?.class_id) {
      query = query.eq('class_id', params.class_id);
    }

    if (params?.sales_month) {
      query = query.eq('sales_month', params.sales_month);
    }

    if (params?.startDate) {
      query = query.gte('enrollment_date', params.startDate);
    }

    if (params?.endDate) {
      query = query.lte('enrollment_date', params.endDate);
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
        foreignKeyViolationErrorCode: EnrollmentErrorCode.BAD_REQUEST,
        defaultErrorCode: EnrollmentErrorCode.FETCH_FAILED,
      });
    }

    const rawEnrollments = (data as unknown as Enrollment[]) || [];

    let leadMap: Map<number, { full_name: string | null; phone_number: string | null }> = new Map();
    let userMap: Map<string, string | null> = new Map();
    if (rawEnrollments.length > 0) {
      // .in('id', leadIds) sends a literal "null" into the Postgres IN-list if a
      // stray null slips through, which errors the whole query (400) rather than
      // just skipping that one id — silently emptying leadMap for every row in
      // the batch, not just the null one. Filter nulls out before the query.
      const leadIds = [...new Set(rawEnrollments.map((e) => e.lead_id).filter((id): id is number => id != null))];
      const userIds = [...new Set(rawEnrollments.map((e) => e.created_by).filter((id): id is string => !!id))];

      const [{ data: leadsData }, { data: usersData }] = await Promise.all([
        leadIds.length > 0
          ? supabase.from('leads').select('id, full_name, phone_number').in('id', leadIds)
          : Promise.resolve({ data: [] }),
        userIds.length > 0
          ? supabase.from('users').select('id, full_name').in('id', userIds)
          : Promise.resolve({ data: [] }),
      ]);

      if (leadsData) {
        leadMap = new Map(
          (leadsData as unknown as { id: number; full_name: string | null; phone_number: string | null }[]).map(
            (l) => [l.id, { full_name: l.full_name, phone_number: l.phone_number }],
          ),
        );
      }

      if (usersData) {
        userMap = new Map(
          (usersData as unknown as { id: string; full_name: string | null }[]).map((u) => [u.id, u.full_name]),
        );
      }
    }

    const enrichedEnrollments: Enrollment[] = rawEnrollments.map((enrollment) => {
      const lead = leadMap.get(enrollment.lead_id);
      return {
        ...enrollment,
        lead_full_name: lead?.full_name ?? null,
        lead_phone_number: lead?.phone_number ?? null,
        created_by_name: enrollment.created_by
          ? (userMap.get(enrollment.created_by) ?? SMAX_SUPPORTER_DIRECTORY[enrollment.created_by] ?? null)
          : null,
      };
    });

    return {
      data: enrichedEnrollments,
      total: count ?? 0,
    };
  } catch (error) {
    handleServiceError(error, EnrollmentErrorCode.FETCH_FAILED);
  }
}

export async function fetchEnrollmentById(id: number): Promise<Enrollment> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('enrollments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      handleSupabaseError(error, {
        notFoundErrorCode: EnrollmentErrorCode.NOT_FOUND,
        defaultErrorCode: EnrollmentErrorCode.NOT_FOUND,
      });
    }

    return validateDataExists(data as unknown as Enrollment, EnrollmentErrorCode.NOT_FOUND);
  } catch (error) {
    handleServiceError(error, EnrollmentErrorCode.NOT_FOUND);
  }
}

export async function createEnrollment(input: CreateEnrollmentInput): Promise<Enrollment> {
  try {
    const supabase = createAdminClient();

    const insertData: InsertTables<'enrollments'> = {
      lead_id: input.lead_id,
      category: input.category,
      course_id: input.course_id ?? null,
      class_id: input.class_id ?? null,
      item_name: input.item_name ?? null,
      enrollment_date: input.enrollment_date,
      sales_month: input.sales_month,
      source: input.source ?? null,
      expected_study_month: input.expected_study_month ?? null,
      tuition_fee: input.tuition_fee ?? 0,
      deposit_amount: input.deposit_amount ?? 0,
      debt_note: input.debt_note ?? null,
      note: input.note ?? null,
      created_by: input.created_by ?? null,
    };

    const { data, error } = await supabase
      .from('enrollments')
      .insert(insertData as never)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, {
        foreignKeyViolationErrorCode: EnrollmentErrorCode.BAD_REQUEST,
        defaultErrorCode: EnrollmentErrorCode.CREATE_FAILED,
      });
    }

    return data as unknown as Enrollment;
  } catch (error) {
    handleServiceError(error, EnrollmentErrorCode.CREATE_FAILED);
  }
}

export async function ensureEnrollmentForLead(input: CreateEnrollmentInput): Promise<Enrollment> {
  try {
    const supabase = createAdminClient();

    const { data: existing, error: existingError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('lead_id', input.lead_id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingError) {
      handleSupabaseError(existingError, {
        defaultErrorCode: EnrollmentErrorCode.FETCH_FAILED,
      });
    }

    if (existing) {
      return existing as unknown as Enrollment;
    }

    return await createEnrollment(input);
  } catch (error) {
    handleServiceError(error, EnrollmentErrorCode.CREATE_FAILED);
  }
}

export async function updateEnrollmentById(
  id: number,
  input: UpdateEnrollmentInput
): Promise<Enrollment> {
  try {
    const supabase = createAdminClient();

    const updateData: UpdateTables<'enrollments'> = {
      ...input,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('enrollments')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, {
        notFoundErrorCode: EnrollmentErrorCode.NOT_FOUND,
        foreignKeyViolationErrorCode: EnrollmentErrorCode.BAD_REQUEST,
        defaultErrorCode: EnrollmentErrorCode.UPDATE_FAILED,
      });
    }

    return validateDataExists(data as unknown as Enrollment, EnrollmentErrorCode.NOT_FOUND);
  } catch (error) {
    handleServiceError(error, EnrollmentErrorCode.UPDATE_FAILED);
  }
}

export interface EnrollmentRevenueSummary {
  totalEnrollments: number;
  totalTuitionFee: number;
  totalPaid: number;
  totalDebt: number;
  bySource: { source: string; count: number; tuitionFee: number }[];
}

export async function getEnrollmentRevenueSummary(
  startAt: string,
  endAt: string,
): Promise<EnrollmentRevenueSummary> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('enrollments')
      .select('source, tuition_fee, paid_amount, debt_amount')
      .gte('enrollment_date', startAt)
      .lte('enrollment_date', endAt);

    if (error) {
      handleSupabaseError(error, { defaultErrorCode: EnrollmentErrorCode.FETCH_FAILED });
    }

    const rows = (data ?? []) as unknown as {
      source: string | null;
      tuition_fee: number;
      paid_amount: number;
      debt_amount: number;
    }[];

    const sourceStats = new Map<string, { count: number; tuitionFee: number }>();
    let totalTuitionFee = 0;
    let totalPaid = 0;
    let totalDebt = 0;

    for (const row of rows) {
      totalTuitionFee += row.tuition_fee;
      totalPaid += row.paid_amount;
      totalDebt += row.debt_amount;

      const sourceKey = row.source?.trim() || 'Khác';
      const existing = sourceStats.get(sourceKey) ?? { count: 0, tuitionFee: 0 };
      sourceStats.set(sourceKey, {
        count: existing.count + 1,
        tuitionFee: existing.tuitionFee + row.tuition_fee,
      });
    }

    return {
      totalEnrollments: rows.length,
      totalTuitionFee,
      totalPaid,
      totalDebt,
      bySource: Array.from(sourceStats.entries()).map(([source, stats]) => ({
        source,
        count: stats.count,
        tuitionFee: stats.tuitionFee,
      })),
    };
  } catch (error) {
    handleServiceError(error, EnrollmentErrorCode.FETCH_FAILED);
  }
}

export async function deleteEnrollmentById(id: number): Promise<void> {
  try {
    const supabase = createAdminClient();

    const { data: enrollmentRow } = await supabase
      .from('enrollments')
      .select('lead_id')
      .eq('id', id)
      .single();

    // payment_tickets.enrollment_id is ON DELETE SET NULL, not CASCADE — left
    // alone, deleting the enrollment would silently orphan its payment
    // tickets (still in the DB, but no longer counted in any enrollment's
    // paid_amount/debt_amount). Delete them explicitly so removing an
    // enrollment actually removes its money history instead of hiding it.
    const { error: ticketsError } = await supabase
      .from('payment_tickets')
      .delete()
      .eq('enrollment_id', id);

    if (ticketsError) {
      handleSupabaseError(ticketsError, { defaultErrorCode: EnrollmentErrorCode.DELETE_FAILED });
    }

    const { error } = await supabase.from('enrollments').delete().eq('id', id);

    if (error) {
      handleSupabaseError(error, { defaultErrorCode: EnrollmentErrorCode.DELETE_FAILED });
    }

    // The accounting page auto-materializes a blank enrollment for any
    // "converted" lead that doesn't already have one — left as CONVERTED,
    // this lead would immediately get a fresh empty enrollment back the
    // next time that page loads, making the delete look like it never
    // happened. Best-effort: an enrollment delete having already succeeded
    // shouldn't fail just because this follow-up status flip did.
    const leadId = (enrollmentRow as { lead_id: number } | null)?.lead_id;
    if (leadId) {
      try {
        await supabase
          .from('leads')
          .update({ status: LeadStatus.INTERESTED } as never)
          .eq('id', leadId)
          .eq('status', LeadStatus.CONVERTED);
      } catch {
        // best-effort — see comment above
      }
    }
  } catch (error) {
    handleServiceError(error, EnrollmentErrorCode.DELETE_FAILED);
  }
}
