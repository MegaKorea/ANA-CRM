import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Tables, UpdateTables, InsertTables } from '@/types/supabase';
import { handleServiceError, handleSupabaseError, validateDataExists } from '@/lib/utils/error-handler';
import { HttpStatusCode, UserErrorCode, UserStatusDb } from '@/constants/enums';
import type { CreateUserInput, UpdateUserInput } from '@/lib/validators/user.validator';
import { AppError } from '@/errors';

export type User = Tables<'users'>;

export interface UserQueryParams {
  search?: string;
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

    const updateData: UpdateTables<'users'> = {};

    if (input.email !== undefined) {
      updateData.email = input.email;
    }

    if (input.full_name !== undefined) {
      updateData.full_name = input.full_name;
    }

    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }

    if (input.avatar !== undefined) {
      updateData.avatar = input.avatar ?? null;
    }

    if (input.sex !== undefined) {
      updateData.sex = input.sex ?? null;
    }

    if (input.age !== undefined) {
      updateData.age = input.age ?? null;
    }

    if (input.address !== undefined) {
      updateData.address = input.address ?? null;
    }

    if (input.birth_day !== undefined) {
      updateData.birth_day = input.birth_day ?? null;
    }

    if (input.role_id !== undefined) {
      updateData.role_id = input.role_id;
    }

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

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

