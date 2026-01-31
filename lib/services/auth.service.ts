import { createClient } from '@/lib/supabase/server';
import { AppError } from '@/errors';
import { HttpStatusCode, AuthErrorCode, UserStatusDb, AuthMessage } from '@/constants/enums';
import type { LoginInput } from '@/lib/validators/auth.validator';
import type { Tables, UpdateTables } from '@/types/supabase';
import { handleSupabaseError } from '@/lib/utils/error-handler';

type UserData = Pick<Tables<'users'>, 'id' | 'email' | 'full_name' | 'status'>;

export interface LoginResult {
  user: {
    id: string;
    email: string;
    fullName: string;
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
}

export async function loginWithEmailAndPassword(
  input: LoginInput
): Promise<LoginResult> {
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  console.log(authError);

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

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, full_name, status')
    .eq('id', authData.user.id)
    .single<UserData>();

  if (userError) {
    handleSupabaseError(userError, {
      notFoundErrorCode: AuthErrorCode.UNAUTHORIZED,
      defaultErrorCode: AuthErrorCode.LOGIN_FAILED,
    }, HttpStatusCode.INTERNAL_SERVER_ERROR);
  }

  if (!userData) {
    throw new AppError(
      AuthErrorCode.LOGIN_FAILED,
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

  if (userData.status !== UserStatusDb.ACTIVE) {
    throw new AppError(
      AuthErrorCode.UNAUTHORIZED,
      HttpStatusCode.UNAUTHORIZED
    );
  }

  const updateData: UpdateTables<'users'> = { last_login: new Date().toISOString() };
  
  await supabase
    .from('users')
    .update(updateData as never)
    .eq('id', authData.user.id);

  const userEmail = userData.email ?? input.email;

  return {
    user: {
      id: userData.id,
      email: userEmail,
      fullName: userData.full_name,
    },
    session: {
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
    },
  };
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

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, full_name, status')
    .eq('id', authUser.id)
    .single<UserData>();

  if (userError) {
    handleSupabaseError(userError, {
      notFoundErrorCode: AuthErrorCode.UNAUTHORIZED,
      defaultErrorCode: AuthErrorCode.UNAUTHORIZED,
    }, HttpStatusCode.UNAUTHORIZED);
  }

  if (!userData) {
    throw new AppError(
      AuthErrorCode.UNAUTHORIZED,
      HttpStatusCode.UNAUTHORIZED
    );
  }

  return {
    id: userData.id,
    email: userData.email,
    fullName: userData.full_name,
    status: userData.status,
  };
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
