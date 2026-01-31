import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { message } from 'antd';
import { api } from '@/lib/axios';
import type { LoginInput } from '@/lib/validators/auth.validator';
import { AuthApiPath, LoginFormMessage, LogoutMessage } from '@/constants/auth';
import { DEFAULT_AUTHENTICATED_ROUTE, AUTH_ROUTES } from '@/constants/routes';

interface LoginResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}

export function useLogin() {
  const router = useRouter();

  return useMutation<LoginResponse, unknown, LoginInput>({
    mutationFn: (input: LoginInput) => api.post<LoginResponse>(AuthApiPath.LOGIN, input),
    onSuccess: () => {
      message.success(LoginFormMessage.LOGIN_SUCCESS);
      router.push(DEFAULT_AUTHENTICATED_ROUTE);
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

  return useMutation({
    mutationFn: () => api.post(AuthApiPath.LOGOUT),
    onSuccess: () => {
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
