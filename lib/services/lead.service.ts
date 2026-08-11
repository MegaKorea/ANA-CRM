import { createAdminClient } from '@/lib/supabase/admin';
import { handleServiceError, handleSupabaseError, validateDataExists } from '@/lib/utils/error-handler';
import { LeadErrorCode, LeadStatus } from '@/constants/enums';
import type { CreateLeadInput, UpdateLeadInput } from '@/lib/validators/lead.validator';
import { buildUpdateByRules } from '@/app/utils/buildUpdateByRules';
import { LeadsTable } from '../supabase/types/tables/leads';
import type { InsertTables, UpdateTables } from '@/types/supabase';

export type Lead = LeadsTable['Row'];

export interface LeadQueryParams {
  search?: string;
  status?: LeadStatus;
  excludeStatus?: LeadStatus;
  telesales_id?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
  course_id?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedLeads {
  data: Lead[];
  total: number;
}

export async function fetchAllLeads(params?: LeadQueryParams): Promise<PaginatedLeads> {
  try {
    const supabase = createAdminClient();
    let query = supabase.from('leads').select('*', { count: 'exact' });

    if (params?.search) {
      const keyword = params.search.trim();
      if (keyword) {
        query = query.or(`full_name.ilike.*${keyword}*,email.ilike.*${keyword}*,phone_number.ilike.*${keyword}*`);
      }
    }

    if (params?.status) {
      query = query.eq('status', params.status);
    } else if (params?.excludeStatus) {
      query = query.neq('status', params.excludeStatus);
    }

    if (params?.telesales_id) {
      query = query.eq('telesales_id', params.telesales_id);
    }

    if (params?.source) {
      query = query.eq('source', params.source);
    }

    if (params?.course_id) {
      query = query.contains('course_ids', [params.course_id]);
    }

    if (params?.startDate) {
      query = query.gte('created_at', params.startDate);
    }

    if (params?.endDate) {
      const endOfDay = params.endDate.includes('T') ? params.endDate : `${params.endDate}T23:59:59.999Z`;
      query = query.lte('created_at', endOfDay);
    }

    query = query.order('created_at', { ascending: false });

    if (params?.page && params?.limit) {
      const from = (params.page - 1) * params.limit;
      const to = from + params.limit - 1;
      query = query.range(from, to);
    }

    const { data, count, error } = await query;
    if (error) {
      if (error.code === 'PGRST103') {
        return {
          data: [],
          total: count ?? 0,
        };
      }
      handleSupabaseError(error, {
        defaultErrorCode: LeadErrorCode.FETCH_FAILED,
      });
    }

    return {
      data: (data as unknown as Lead[]) || [],
      total: count ?? 0,
    };
  } catch (error) {
    handleServiceError(error, LeadErrorCode.FETCH_FAILED);
  }
}

export async function fetchLeadById(id: number): Promise<Lead> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      handleSupabaseError(error, {
        notFoundErrorCode: LeadErrorCode.NOT_FOUND,
        defaultErrorCode: LeadErrorCode.NOT_FOUND,
      });
    }

    return validateDataExists(data as unknown as Lead, LeadErrorCode.NOT_FOUND);
  } catch (error) {
    handleServiceError(error, LeadErrorCode.NOT_FOUND);
  }
}

/**
 * Finds an existing lead that collides with the given name or phone number.
 * Used by the staff lead-form to detect duplicates before creating a new lead.
 * Phone (a strong identity signal) is matched first, then full name
 * (case-insensitive). Returns the most recent match, or null when none exists.
 */
export async function findDuplicateLead(
  fullName: string,
  phoneNumber?: string | null
): Promise<Lead | null> {
  try {
    const supabase = createAdminClient();

    if (phoneNumber) {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('phone_number', phoneNumber)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        handleSupabaseError(error, { defaultErrorCode: LeadErrorCode.FETCH_FAILED });
      }

      if (data && data.length > 0) {
        return data[0] as unknown as Lead;
      }
    }

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .ilike('full_name', fullName)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      handleSupabaseError(error, { defaultErrorCode: LeadErrorCode.FETCH_FAILED });
    }

    return data && data.length > 0 ? (data[0] as unknown as Lead) : null;
  } catch (error) {
    handleServiceError(error, LeadErrorCode.FETCH_FAILED);
  }
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  try {
    const supabase = createAdminClient();

    const insertData: InsertTables<'leads'> = {
      email: input.email ?? null,
      phone_number: input.phone_number ?? null,
      full_name: input.full_name,
      date_of_birth: input.date_of_birth ?? null,
      place_of_birth: input.place_of_birth ?? null,
      place_of_origin: input.place_of_origin ?? null,
      current_address: input.current_address ?? null,
      current_address_temp: input.current_address_temp ?? null,
      citizen_id: input.citizen_id ?? null,
      nationality: input.nationality ?? null,
      ethnicity: input.ethnicity ?? null,
      meta_data: input.meta_data ? (input.meta_data as never) : ({} as never),
      source: input.source ?? null,
      telesales_id: input.telesales_id ?? null,
      status: input.status ?? LeadStatus.NEW,
      note: input.note ?? ([] as never),
      course_ids: input.course_ids ?? null,

      appointment_date: input.appointment_date ?? null,
      attendance_status: (input.attendance_status as never) ?? 'not_arrived',
      images: input.images ?? null,
      facebook_url: input.facebook_url ?? null,
      pid_zalo: input.pid_zalo ?? null,
      conversation: input.conversation ?? null,
      tuition_fee: input.tuition_fee ?? 0,
      rate: input.rate ?? 0,
      smax_log: input.smax_log ? (input.smax_log as never) : null,
    };

    const { data, error } = await supabase
      .from('leads')
      .insert(insertData as never)
      .select()
      .single();




    if (error) {
      handleSupabaseError(error, {
        foreignKeyViolationErrorCode: LeadErrorCode.CREATE_FAILED,
        defaultErrorCode: LeadErrorCode.CREATE_FAILED,
      });
    }

    return data as Lead;
  } catch (error) {
    handleServiceError(error, LeadErrorCode.CREATE_FAILED);
  }
}

export async function updateLeadById(id: number, input: UpdateLeadInput): Promise<Lead> {
  try {
    const supabase = createAdminClient();

    const updateData: UpdateTables<'leads'> = buildUpdateByRules(input, {
      email: 'nullable',
      phone_number: 'nullable',
      full_name: 'direct',
      date_of_birth: 'nullable',
      place_of_birth: 'nullable',
      place_of_origin: 'nullable',
      current_address: 'nullable',
      current_address_temp: 'nullable',
      citizen_id: 'nullable',
      nationality: 'nullable',
      ethnicity: 'nullable',
      meta_data: 'object',
      source: 'nullable',
      telesales_id: 'nullable',
      status: 'direct',
      note: 'nullable',
      course_ids: 'nullable',

      appointment_date: 'nullable',
      attendance_status: 'direct',
      images: 'nullable',
      facebook_url: 'nullable',
      pid_zalo: 'nullable',
      conversation: 'nullable',
      tuition_fee: 'nullable',
      rate: 'direct',
      smax_log: 'object',
      created_at: 'direct',
    });

    if (Object.keys(updateData).length > 0) {
      const { data, error } = await supabase
        .from('leads')
        .update(updateData as never)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        handleSupabaseError(error, {
          foreignKeyViolationErrorCode: LeadErrorCode.UPDATE_FAILED,
          notFoundErrorCode: LeadErrorCode.NOT_FOUND,
          defaultErrorCode: LeadErrorCode.UPDATE_FAILED,
        });
      }

      return validateDataExists(data as unknown as Lead, LeadErrorCode.NOT_FOUND);
    }

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      handleSupabaseError(error, {
        notFoundErrorCode: LeadErrorCode.NOT_FOUND,
        defaultErrorCode: LeadErrorCode.NOT_FOUND,
      });
    }

    return validateDataExists(data as unknown as Lead, LeadErrorCode.NOT_FOUND);
  } catch (error) {
    handleServiceError(error, LeadErrorCode.UPDATE_FAILED);
  }
}

export async function deleteLeadById(id: number): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('leads').delete().eq('id', id);

    if (error) {
      handleSupabaseError(error, {
        foreignKeyViolationErrorCode: LeadErrorCode.DELETE_FAILED,
        defaultErrorCode: LeadErrorCode.DELETE_FAILED,
      });
    }
  } catch (error) {
    handleServiceError(error, LeadErrorCode.DELETE_FAILED);
  }
}
