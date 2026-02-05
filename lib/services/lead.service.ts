import { createAdminClient } from '@/lib/supabase/admin';
import type { Tables, UpdateTables, InsertTables } from '@/types/supabase';
import { handleServiceError, handleSupabaseError, validateDataExists } from '@/lib/utils/error-handler';
import { LeadErrorCode, LeadStatus } from '@/constants/enums';
import type { CreateLeadInput, UpdateLeadInput } from '@/lib/validators/lead.validator';
import { buildUpdateByRules } from '@/app/utils/buildUpdateByRules';


export type Lead = Tables<'leads'>;

export interface LeadQueryParams {
  search?: string;
  status?: LeadStatus;
  telesales_id?: string;
}

export async function fetchAllLeads(params?: LeadQueryParams): Promise<Lead[]> {
  try {
    const supabase = createAdminClient();
    let query = supabase.from('leads').select('*');

    if (params?.search) {
      const keyword = params.search.trim();
      if (keyword) {
        query = query.or(`full_name.ilike.*${keyword}*,email.ilike.*${keyword}*,phone_number.ilike.*${keyword}*`);
      }
    }

    if (params?.status) {
      query = query.eq('status', params.status);
    }

    if (params?.telesales_id) {
      query = query.eq('telesales_id', params.telesales_id);
    }

    const { data, error } = await query;
    if (error) {
      handleSupabaseError(error, {
        defaultErrorCode: LeadErrorCode.FETCH_FAILED,
      });
    }

    return (data as unknown as Lead[]) || [];
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
      citizen_id: input.citizen_id ?? null,
      nationality: input.nationality ?? null,
      ethnicity: input.ethnicity ?? null,
      meta_data: input.meta_data ? (input.meta_data as never) : ({} as never),
      source: input.source ?? null,
      telesales_id: input.telesales_id ?? null,
      status: input.status ?? LeadStatus.NEW,
      note: input.note ?? null,
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
      citizen_id: 'nullable',
      nationality: 'nullable',
      ethnicity: 'nullable',
      meta_data: 'object',
      source: 'nullable',
      telesales_id: 'nullable',
      status: 'direct',
      note: 'nullable',
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
