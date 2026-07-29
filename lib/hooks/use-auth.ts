import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { App } from 'antd';
import { api } from '@/lib/axios';
import type { LoginInput } from '@/lib/validators/auth.validator';
import { AuthApiPath, AuthQueryKey, LoginFormMessage, LogoutMessage } from '@/constants/auth';
import { DEFAULT_AUTHENTICATED_ROUTE, AUTH_ROUTES } from '@/constants/routes';
import { UserStatusDb } from '@/constants/enums';
import type { CurrentUser } from '@/lib/services/auth.service';
import { useUserStore } from '@/lib/stores/user.store';
import { getSupabaseClient } from '@/lib/supabase/client';

interface LoginResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    roleCode?: string | null;
  };
}

function toCurrentUser(loginUser: LoginResponse['user']): CurrentUser {
  return {
    id: loginUser.id,
    email: loginUser.email,
    fullName: loginUser.fullName,
    status: UserStatusDb.ACTIVE,
    roleCode: loginUser.roleCode ?? null,
  };
}

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  // Context-aware message so toasts follow the active theme.
  const { message } = App.useApp();

  return useMutation<LoginResponse, unknown, LoginInput>({
    mutationFn: (input: LoginInput) => api.post<LoginResponse>(AuthApiPath.LOGIN, input),
    onSuccess: (data) => {
      if (data?.user) {
        const currentUser = toCurrentUser(data.user);
        useUserStore.getState().setUser(currentUser);
        queryClient.setQueryData([AuthQueryKey.ME], currentUser);
      }

      message.success(LoginFormMessage.LOGIN_SUCCESS);

      if (data?.user?.roleCode === 'STU') {
        router.push('/student');
      } else {
        router.push(DEFAULT_AUTHENTICATED_ROUTE);
      }

      router.refresh();
    },
    onError: (error: unknown) => {
      const errorData = error as { message?: string; data?: { message?: string } };
      const errorMessage =
        errorData?.data?.message || errorData?.message || LoginFormMessage.LOGIN_ERROR;
      message.error(errorMessage);
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async () => {
      try {
        await api.post(AuthApiPath.LOGOUT);
      } catch (error) {
        console.error('Logout API failed:', error);
      }

      const supabase = getSupabaseClient();
      await supabase.auth.signOut();

      return true;
    },
    onSuccess: () => {
      // Clear React Query cache
      queryClient.clear();

      // Clear Zustand user store
      useUserStore.getState().clearUser();

      message.success(LogoutMessage.SUCCESS);
      router.push(AUTH_ROUTES[0]);
      router.refresh();
    },
    onError: (error: unknown) => {
      const errorData = error as { message?: string; data?: { message?: string } };
      const errorMessage =
        errorData?.data?.message || errorData?.message || LogoutMessage.ERROR;
      message.error(errorMessage);
    },
  });
}
