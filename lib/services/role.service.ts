import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { RoleErrorCode, HttpStatusCode, RoleId } from '@/constants/enums';
import type { InsertTables, Tables, UpdateTables } from '@/types/supabase';
import { handleServiceError, validateDataExists, handleSupabaseError } from '@/lib/utils/error-handler';
import { buildUpdateByRules } from '@/app/utils/buildUpdateByRules';

export type Role = Tables<'roles'>;

export type CreateRoleInput = {
  name: string;
  code: string;
  description?: string;
};

export type UpdateRoleInput = {
  name?: string;
  code?: string;
  description?: string;
};

export async function fetchAllRoles(): Promise<Role[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .neq('id', RoleId.EXCLUDED);
    if (error) {      
      handleSupabaseError(error, {
        defaultErrorCode: RoleErrorCode.FETCH_FAILED,
      });
    }

    return (data as unknown as Role[]) || [];
  } catch (error) {
    handleServiceError(error, RoleErrorCode.FETCH_FAILED);
  }
}

export async function fetchRoleById(id: number): Promise<Role> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      handleSupabaseError(error, {
        notFoundErrorCode: RoleErrorCode.NOT_FOUND,
        defaultErrorCode: RoleErrorCode.NOT_FOUND,
      });
    }

    return validateDataExists(data as unknown as Role, RoleErrorCode.NOT_FOUND);
  } catch (error) {
    handleServiceError(error, RoleErrorCode.NOT_FOUND);
  }
}

export async function createRole(input: CreateRoleInput): Promise<Role> {
  try {
    const supabase = createAdminClient();
    const insertData: InsertTables<'roles'> = {
      name: input.name,
      code: input.code,
      description: input.description || null,
    };
    const { data, error } = await supabase
      .from('roles')
      .insert(insertData as never)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, {
        uniqueViolationNameErrorCode: RoleErrorCode.NAME_DUPLICATE,
        uniqueViolationCodeErrorCode: RoleErrorCode.CODE_DUPLICATE,
        defaultErrorCode: RoleErrorCode.CREATE_FAILED,
      });
    }

    return validateDataExists(
      data as unknown as Role,
      RoleErrorCode.CREATE_FAILED,
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  } catch (error) {
    handleServiceError(error, RoleErrorCode.CREATE_FAILED);
  }
}

export async function updateRoleById(id: number, input: UpdateRoleInput): Promise<Role> {
  try {
    const supabase = createAdminClient();
    const updateData: UpdateTables<'roles'> = buildUpdateByRules(input, {
      name: 'direct',
      code: 'direct',
      description: 'nullable',
    });

    const { data, error } = await supabase
      .from('roles')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, {
        uniqueViolationNameErrorCode: RoleErrorCode.NAME_DUPLICATE,
        uniqueViolationCodeErrorCode: RoleErrorCode.CODE_DUPLICATE,
        notFoundErrorCode: RoleErrorCode.NOT_FOUND,
        defaultErrorCode: RoleErrorCode.UPDATE_FAILED,
      });
    }

    return validateDataExists(data as unknown as Role, RoleErrorCode.NOT_FOUND);
  } catch (error) {
    handleServiceError(error, RoleErrorCode.UPDATE_FAILED);
  }
}

export async function deleteRoleById(id: number): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', id);

    if (error) {
      handleSupabaseError(error, {
        foreignKeyViolationErrorCode: RoleErrorCode.DELETE_FAILED,
        defaultErrorCode: RoleErrorCode.DELETE_FAILED,
      });
    }
  } catch (error) {
    handleServiceError(error, RoleErrorCode.DELETE_FAILED);
  }
}
