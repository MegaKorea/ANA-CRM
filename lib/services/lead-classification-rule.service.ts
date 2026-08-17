import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { LeadClassificationRuleErrorCode, HttpStatusCode, LeadStatus } from '@/constants/enums';
import type { InsertTables, Tables, UpdateTables } from '@/types/supabase';
import { handleServiceError, validateDataExists, handleSupabaseError } from '@/lib/utils/error-handler';
import { AppError } from '@/errors';

export type LeadClassificationRule = Tables<'lead_classification_rules'>;

export type CreateLeadClassificationRuleInput = {
  name: string;
  recentInteractionHours: number;
  racKqtStatuses: LeadStatus[];
};

export type UpdateLeadClassificationRuleInput = Partial<CreateLeadClassificationRuleInput>;

function assertNotSystemRow(rule: LeadClassificationRule): void {
  if (rule.is_system) {
    throw new AppError(
      LeadClassificationRuleErrorCode.SYSTEM_ROW_IMMUTABLE,
      HttpStatusCode.BAD_REQUEST,
      'Không thể sửa/xóa quy tắc mặc định hệ thống',
    );
  }
}

async function fetchRuleOrThrow(id: number): Promise<LeadClassificationRule> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('lead_classification_rules')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    handleSupabaseError(error, {
      notFoundErrorCode: LeadClassificationRuleErrorCode.NOT_FOUND,
      defaultErrorCode: LeadClassificationRuleErrorCode.FETCH_FAILED,
    });
  }

  return validateDataExists(data as unknown as LeadClassificationRule, LeadClassificationRuleErrorCode.NOT_FOUND);
}

export async function fetchAllLeadClassificationRules(): Promise<LeadClassificationRule[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('lead_classification_rules')
      .select('*')
      .order('is_system', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      handleSupabaseError(error, {
        defaultErrorCode: LeadClassificationRuleErrorCode.FETCH_FAILED,
      });
    }

    return (data as unknown as LeadClassificationRule[]) || [];
  } catch (error) {
    handleServiceError(error, LeadClassificationRuleErrorCode.FETCH_FAILED);
  }
}

export async function getActiveLeadClassificationRule(): Promise<LeadClassificationRule | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lead_classification_rules')
    .select('*')
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    handleSupabaseError(error, {
      defaultErrorCode: LeadClassificationRuleErrorCode.FETCH_FAILED,
    });
  }

  return (data as unknown as LeadClassificationRule) || null;
}

export async function createLeadClassificationRule(
  input: CreateLeadClassificationRuleInput,
): Promise<LeadClassificationRule> {
  try {
    const supabase = createAdminClient();
    const insertData: InsertTables<'lead_classification_rules'> = {
      name: input.name,
      recent_interaction_hours: input.recentInteractionHours,
      rac_kqt_statuses: input.racKqtStatuses,
      is_system: false,
      is_active: false,
    };
    const { data, error } = await supabase
      .from('lead_classification_rules')
      .insert(insertData as never)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, {
        defaultErrorCode: LeadClassificationRuleErrorCode.CREATE_FAILED,
      });
    }

    return validateDataExists(
      data as unknown as LeadClassificationRule,
      LeadClassificationRuleErrorCode.CREATE_FAILED,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  } catch (error) {
    handleServiceError(error, LeadClassificationRuleErrorCode.CREATE_FAILED);
  }
}

export async function updateLeadClassificationRuleById(
  id: number,
  input: UpdateLeadClassificationRuleInput,
): Promise<LeadClassificationRule> {
  try {
    const existing = await fetchRuleOrThrow(id);
    assertNotSystemRow(existing);

    const updateData: UpdateTables<'lead_classification_rules'> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.recentInteractionHours !== undefined) {
      updateData.recent_interaction_hours = input.recentInteractionHours;
    }
    if (input.racKqtStatuses !== undefined) updateData.rac_kqt_statuses = input.racKqtStatuses;

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('lead_classification_rules')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, {
        notFoundErrorCode: LeadClassificationRuleErrorCode.NOT_FOUND,
        defaultErrorCode: LeadClassificationRuleErrorCode.UPDATE_FAILED,
      });
    }

    return validateDataExists(data as unknown as LeadClassificationRule, LeadClassificationRuleErrorCode.NOT_FOUND);
  } catch (error) {
    handleServiceError(error, LeadClassificationRuleErrorCode.UPDATE_FAILED);
  }
}

export async function deleteLeadClassificationRuleById(id: number): Promise<void> {
  try {
    const existing = await fetchRuleOrThrow(id);
    assertNotSystemRow(existing);

    if (existing.is_active) {
      throw new AppError(
        LeadClassificationRuleErrorCode.DELETE_ACTIVE_FORBIDDEN,
        HttpStatusCode.BAD_REQUEST,
        'Không thể xóa quy tắc đang được sử dụng',
      );
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from('lead_classification_rules').delete().eq('id', id);

    if (error) {
      handleSupabaseError(error, {
        defaultErrorCode: LeadClassificationRuleErrorCode.DELETE_FAILED,
      });
    }
  } catch (error) {
    handleServiceError(error, LeadClassificationRuleErrorCode.DELETE_FAILED);
  }
}

export async function duplicateLeadClassificationRuleById(id: number): Promise<LeadClassificationRule> {
  try {
    const source = await fetchRuleOrThrow(id);
    const allRules = await fetchAllLeadClassificationRules();
    const existingNames = new Set(allRules.map((rule) => rule.name));

    const baseName = `Bản sao của ${source.name}`;
    let name = baseName;
    let suffix = 2;
    while (existingNames.has(name)) {
      name = `${baseName} (${suffix})`;
      suffix += 1;
    }

    return await createLeadClassificationRule({
      name,
      recentInteractionHours: source.recent_interaction_hours,
      racKqtStatuses: source.rac_kqt_statuses as LeadStatus[],
    });
  } catch (error) {
    handleServiceError(error, LeadClassificationRuleErrorCode.CREATE_FAILED);
  }
}

export async function activateLeadClassificationRuleById(id: number): Promise<LeadClassificationRule> {
  try {
    await fetchRuleOrThrow(id);

    const supabase = createAdminClient();

    const { error: deactivateError } = await supabase
      .from('lead_classification_rules')
      .update({ is_active: false } as never)
      .eq('is_active', true);

    if (deactivateError) {
      handleSupabaseError(deactivateError, {
        defaultErrorCode: LeadClassificationRuleErrorCode.ACTIVATE_FAILED,
      });
    }

    const { data, error } = await supabase
      .from('lead_classification_rules')
      .update({ is_active: true } as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, {
        notFoundErrorCode: LeadClassificationRuleErrorCode.NOT_FOUND,
        defaultErrorCode: LeadClassificationRuleErrorCode.ACTIVATE_FAILED,
      });
    }

    return validateDataExists(data as unknown as LeadClassificationRule, LeadClassificationRuleErrorCode.NOT_FOUND);
  } catch (error) {
    handleServiceError(error, LeadClassificationRuleErrorCode.ACTIVATE_FAILED);
  }
}
