import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { useUserStore } from '@/lib/stores/user.store';
import { AuthApiPath, AuthQueryKey } from '@/constants/auth';
import type { CurrentUser } from '@/lib/services/auth.service';

interface CurrentUserResponse {
  user: CurrentUser;
}

async function fetchCurrentUser(): Promise<CurrentUser> {
  const response = await api.get<CurrentUserResponse>(AuthApiPath.ME);
  return response.user;
}

export function useCurrentUser() {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const setLoading = useUserStore((state) => state.setLoading);
  const clearUser = useUserStore((state) => state.clearUser);

  const { data, isLoading, error } = useQuery<CurrentUser, unknown>({
    queryKey: [AuthQueryKey.ME],
    queryFn: fetchCurrentUser,
    retry: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  useEffect(() => {
    if (data) {
      setUser(data);
    } else if (error) {
      clearUser();
    }
  }, [data, error, setUser, clearUser]);

  return {
    user,
    isLoading,
    error,
  };
}
