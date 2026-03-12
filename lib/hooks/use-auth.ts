import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import { api } from '@/lib/axios';
import type { LoginInput } from '@/lib/validators/auth.validator';
import { AuthApiPath, LoginFormMessage, LogoutMessage } from '@/constants/auth';
import { DEFAULT_AUTHENTICATED_ROUTE, AUTH_ROUTES } from '@/constants/routes';
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

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation<LoginResponse, unknown, LoginInput>({
    mutationFn: (input: LoginInput) => api.post<LoginResponse>(AuthApiPath.LOGIN, input),
    onSuccess: (data) => {
      // Clear React Query cache before login to ensure fresh data
      queryClient.clear();

      // Clear Zustand user store
      useUserStore.getState().clearUser();

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

  return useMutation({
    mutationFn: async () => {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();

      return api.post(AuthApiPath.LOGOUT);
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
