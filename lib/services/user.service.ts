import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Tables, UpdateTables, InsertTables } from '@/types/supabase';
import { handleServiceError, handleSupabaseError, validateDataExists } from '@/lib/utils/error-handler';
import { HttpStatusCode, UserErrorCode, UserStatusDb } from '@/constants/enums';
import type { CreateUserInput, UpdateUserInput } from '@/lib/validators/user.validator';
import { AppError } from '@/errors';
import { buildUpdateByRules } from '@/app/utils/buildUpdateByRules';

export type User = Tables<'users'>;

export interface UserQueryParams {
  search?: string;
  roleCode?: string;
}

export async function fetchAllUsers(params?: UserQueryParams): Promise<User[]> {
  try {
    const supabase = createAdminClient();
    let query = supabase.from('users').select('*');

    if (params?.search) {
      const keyword = params.search.trim();
      if (keyword) {
        query = query.or(`full_name.ilike.*${keyword}*,email.ilike.*${keyword}*`);
      }
    }

    if (params?.roleCode) {
      const { data: role } = await supabase
        .from('roles')
        .select('id')
        .eq('code', params.roleCode)
        .single();

      if (role) {
        query = query.eq('role_id', (role as any).id);
      } else {
        return []; 
      }
    }

    const { data, error } = await query;
    if (error) {
      handleSupabaseError(error, {
        defaultErrorCode: UserErrorCode.FETCH_FAILED,
      });
    }

    return (data as unknown as User[]) || [];
  } catch (error) {
    handleServiceError(error, UserErrorCode.FETCH_FAILED);
  }
}

export async function fetchUserById(id: string): Promise<User> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      handleSupabaseError(error, {
        notFoundErrorCode: UserErrorCode.NOT_FOUND,
        defaultErrorCode: UserErrorCode.NOT_FOUND,
      });
    }

    return validateDataExists(data as unknown as User, UserErrorCode.NOT_FOUND);
  } catch (error) {
    handleServiceError(error, UserErrorCode.NOT_FOUND);
  }
}

export async function createUser(input: CreateUserInput): Promise<User> {
  try {
    const supabase = createAdminClient();
    const { data: existingUser } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', input.email)
      .maybeSingle();

    if (existingUser) {
      throw new AppError(
        UserErrorCode.EMAIL_ALREADY_EXISTS,
        HttpStatusCode.CONFLICT
      );
    }
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
        user_metadata: {
          full_name: input.full_name,
        },
      });

    if (authError || !authUser.user) {
      if (authError?.message?.includes('email') || authError?.message?.includes('Email')) {
        throw new AppError(
          UserErrorCode.EMAIL_ALREADY_EXISTS,
          HttpStatusCode.CONFLICT
        );
      }
      handleSupabaseError(authError, {
        uniqueViolationEmailErrorCode: UserErrorCode.EMAIL_ALREADY_EXISTS,
        defaultErrorCode: UserErrorCode.CREATE_FAILED,
      });
    }

    const insertData: InsertTables<'users'> = {
      id: authUser.user.id,
      email: input.email,
      full_name: input.full_name,
      phone: input.phone ?? null,
      avatar: input.avatar ?? null,
      status: input.status ?? UserStatusDb.ACTIVE,
      sex: input.sex ?? null,
      age: input.age ?? null,
      address: input.address ?? null,
      birth_day: input.birth_day ?? null,
      role_id: input.role_id,
    };

    const { data, error } = await supabase
      .from('users')
      .insert(insertData as never)
      .select()
      .single();

    if (error) {
      await supabase.auth.admin.deleteUser(authUser.user.id);

      handleSupabaseError(error, {
        foreignKeyViolationErrorCode: UserErrorCode.CREATE_FAILED,
        defaultErrorCode: UserErrorCode.CREATE_FAILED,
      });
    }

    return data as User;
  } catch (error) {
    handleServiceError(error, UserErrorCode.CREATE_FAILED);
  }
}

export async function updateUserById(id: string, input: UpdateUserInput): Promise<User> {
  try {
    const supabase = createAdminClient();

    if (input.password !== undefined || input.email !== undefined) {
      const authUpdateData: { password?: string; email?: string; email_confirm?: boolean } = {};

      if (input.password !== undefined) {
        authUpdateData.password = input.password;
      }

      if (input.email !== undefined) {
        authUpdateData.email = input.email;
        authUpdateData.email_confirm = true;
      }

      const { error: authError } = await supabase.auth.admin.updateUserById(id, authUpdateData);

      if (authError) {
        handleSupabaseError(authError, {
          defaultErrorCode: UserErrorCode.UPDATE_FAILED,
        });
      }
    }

    const updateData: UpdateTables<'users'> = buildUpdateByRules(input, {
      email: 'direct',
      full_name: 'direct',
      phone: 'nullable',
      avatar: 'nullable',
      sex: 'nullable',
      age: 'nullable',
      address: 'nullable',
      birth_day: 'nullable',
      role_id: 'direct',
      status: 'direct',
    });

    if (Object.keys(updateData).length > 0) {
      const { data, error } = await supabase
        .from('users')
        .update(updateData as never)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        handleSupabaseError(error, {
          foreignKeyViolationErrorCode: UserErrorCode.UPDATE_FAILED,
          notFoundErrorCode: UserErrorCode.NOT_FOUND,
          defaultErrorCode: UserErrorCode.UPDATE_FAILED,
        });
      }

      return validateDataExists(data as unknown as User, UserErrorCode.NOT_FOUND);
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      handleSupabaseError(error, {
        notFoundErrorCode: UserErrorCode.NOT_FOUND,
        defaultErrorCode: UserErrorCode.NOT_FOUND,
      });
    }

    return validateDataExists(data as unknown as User, UserErrorCode.NOT_FOUND);
  } catch (error) {
    handleServiceError(error, UserErrorCode.UPDATE_FAILED);
  }
}

export async function deleteUserById(id: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('users').delete().eq('id', id);

    if (error) {
      handleSupabaseError(error, {
        foreignKeyViolationErrorCode: UserErrorCode.DELETE_FAILED,
        defaultErrorCode: UserErrorCode.DELETE_FAILED,
      });
    }
  } catch (error) {
    handleServiceError(error, UserErrorCode.DELETE_FAILED);
  }
}

export async function createStudentAccountIfNotExists(
  phone: string,
  fullName: string,
  email?: string | null,
  leadId?: number | null,
): Promise<void> {
  try {
    const supabase = createAdminClient();

    const { data: existingUser } = await supabase
      .from('users')
      .select('id, lead_id')
      .eq('phone', phone)
      .maybeSingle();

    if (existingUser) {
      const row = existingUser as { id: string; lead_id: number | null };
      if (leadId != null && row.lead_id !== leadId) {
        await supabase
          .from('users')
          .update({ lead_id: leadId } as never)
          .eq('id', row.id);
      }
      return;
    }

    const { data: role } = await supabase
      .from('roles')
      .select('id')
      .eq('code', 'STU')
      .single();

    if (!role) {
      console.warn('Student role STU not found. Cannot create account.');
      return;
    }

    const defaultEmail = email || `${phone}@student.ana.edu.vn`;
    const defaultPassword = phone;

    const { data: authUsersResponse, error: authListError } = await supabase.auth.admin.listUsers();

    if (authListError) {
      console.error('Failed to list auth users:', authListError);
      return;
    }

    const existingAuthUser = authUsersResponse.users.find(u => u.email === defaultEmail);

    if (existingAuthUser) {
      const insertData: InsertTables<'users'> = {
        id: existingAuthUser.id,
        email: defaultEmail,
        full_name: fullName,
        phone: phone,
        status: UserStatusDb.ACTIVE,
        role_id: (role as any).id,
        lead_id: leadId ?? null,
      };

      const { error: insertError } = await supabase
        .from('users')
        .insert(insertData as never);

      if (insertError) {
        console.error('Failed to insert user record for existing auth student:', insertError);
      }
      return;
    }

    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: defaultEmail,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: 'STU',
          ...(leadId != null ? { lead_id: leadId } : {}),
        },
      });

    if (authError || !authUser.user) {
      console.error('Failed to create student auth user:', authError);
      return;
    }

    const insertData: InsertTables<'users'> = {
      id: authUser.user.id,
      email: defaultEmail,
      full_name: fullName,
      phone: phone,
      status: UserStatusDb.ACTIVE,
      role_id: (role as any).id,
      lead_id: leadId ?? null,
    };

    const { error: insertError } = await supabase
      .from('users')
      .insert(insertData as never);

    if (insertError) {
      await supabase.auth.admin.deleteUser(authUser.user.id);
      console.error('Failed to insert user record for student:', insertError);
    }
  } catch (error) {
    console.error('Error creating student account:', error);
  }
}
