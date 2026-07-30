import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { AppError } from '@/errors';
import { HttpStatusCode, AuthErrorCode, UserStatusDb, AuthMessage } from '@/constants/enums';
import type { LoginInput } from '@/lib/validators/auth.validator';
import type { Tables, UpdateTables } from '@/types/supabase';


type UserData = Pick<Tables<'users'>, 'id' | 'email' | 'full_name' | 'status'> & {
  roles: Pick<Tables<'roles'>, 'code'> | null;
};

export interface LoginResult {
  user: {
    id: string;
    email: string;
    fullName: string;
    roleCode: string | null;
  };
  session: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface CurrentUser {
  id: string;
  email: string | null;
  fullName: string;
  status: string;
  roleCode: string | null;
}

export async function loginWithEmailAndPassword(
  input: LoginInput
): Promise<LoginResult> {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (authError) {
    if (authError.message.includes(AuthMessage.INVALID_CREDENTIALS)) {
      throw new AppError(
        AuthErrorCode.INVALID_CREDENTIALS,
        HttpStatusCode.UNAUTHORIZED
      );
    }

    throw new AppError(
      AuthErrorCode.LOGIN_FAILED,
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

  if (!authData.user || !authData.session) {
    throw new AppError(
      AuthErrorCode.LOGIN_FAILED,
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

  const adminClient = createAdminClient();
  const { data: userData } = await adminClient
    .from('users')
    .select('id, email, full_name, status, roles(code)')
    .eq('id', authData.user.id)
    .maybeSingle() as { data: UserData | null, error: any };

  if (userData) {
    if (userData.status !== UserStatusDb.ACTIVE) {
      throw new AppError(
        AuthErrorCode.UNAUTHORIZED,
        HttpStatusCode.UNAUTHORIZED
      );
    }

    const updateData: UpdateTables<'users'> = { last_login: new Date().toISOString() };
    await adminClient.from('users').update(updateData as never).eq('id', authData.user.id);

    return {
      user: {
        id: userData.id,
        email: userData.email ?? input.email,
        fullName: userData.full_name,
        roleCode: userData.roles?.code ?? null,
      },
      session: {
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
      },
    };
  }

  throw new AppError(
    AuthErrorCode.LOGIN_FAILED,
    HttpStatusCode.INTERNAL_SERVER_ERROR
  );
}

export async function getCurrentUser(): Promise<CurrentUser> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    throw new AppError(
      AuthErrorCode.UNAUTHORIZED,
      HttpStatusCode.UNAUTHORIZED
    );
  }

  const adminClient = createAdminClient();
  const { data: userData } = await adminClient
    .from('users')
    .select('id, email, full_name, status, roles(code)')
    .eq('id', authUser.id)
    .maybeSingle() as { data: UserData | null, error: any };

  if (userData) {
    return {
      id: userData.id,
      email: userData.email,
      fullName: userData.full_name,
      status: userData.status,
      roleCode: userData.roles?.code ?? null,
    };
  }

  throw new AppError(
    AuthErrorCode.UNAUTHORIZED,
    HttpStatusCode.UNAUTHORIZED
  );
}

export async function logout(): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new AppError(
      AuthErrorCode.INTERNAL_SERVER_ERROR,
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }
}
