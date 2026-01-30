import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { InsertTables, Tables, UpdateTables } from '@/types/supabase';
import { handleServiceError, handleSupabaseError, validateDataExists } from '@/lib/utils/error-handler';
import { HttpStatusCode, UserErrorCode } from '@/constants/enums';
import type { CreateUserInput, UpdateUserInput } from '@/lib/validators/user.validator';

export type User = Tables<'users'>;

export async function fetchAllUsers(): Promise<User[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('users').select('*');
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

export async function fetchUserById(id: number): Promise<User> {
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

    const insertData: InsertTables<'users'> = {
      full_name: input.full_name,
      password: input.password,
      phone: input.phone ?? null,
      avatar: input.avatar ?? null,
      status: input.status ?? undefined,
      sex: input.sex ?? null,
      age: input.age ?? null,
      address: input.address ?? null,
      birth_day: input.birth_day ?? null,
      role_id: input.role_id,
      last_login: null,
      updated_at: undefined,
      created_at: undefined,
    };

    const { data, error } = await supabase
      .from('users')
      .insert(insertData as never)
      .select()
      .single();

      console.log(error)

    if (error) {
      handleSupabaseError(error, {
        foreignKeyViolationErrorCode: UserErrorCode.CREATE_FAILED,
        defaultErrorCode: UserErrorCode.CREATE_FAILED,
      });
    }

    return validateDataExists(
      data as unknown as User,
      UserErrorCode.CREATE_FAILED,
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  } catch (error) {
    handleServiceError(error, UserErrorCode.CREATE_FAILED);
  }
}

export async function updateUserById(id: number, input: UpdateUserInput): Promise<User> {
  try {
    const supabase = createAdminClient();

    const updateData: UpdateTables<'users'> = {};

    if (input.full_name !== undefined) {
      updateData.full_name = input.full_name;
    }

    if (input.password !== undefined) {
      updateData.password = input.password;
    }

    if (input.phone !== undefined) {
      updateData.phone = input.phone ?? null;
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
  } catch (error) {
    handleServiceError(error, UserErrorCode.UPDATE_FAILED);
  }
}

export async function deleteUserById(id: number): Promise<void> {
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

