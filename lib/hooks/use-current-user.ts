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

const currentUserQueryOptions = {
  queryKey: [AuthQueryKey.ME] as const,
  queryFn: fetchCurrentUser,
  retry: false,
  refetchOnWindowFocus: false,
};

function computeAuthLoading(
  isLoading: boolean,
  isFetching: boolean,
  data: CurrentUser | undefined,
  storeUser: CurrentUser | null
): boolean {
  const user = data ?? storeUser;
  return (isLoading || isFetching) && user === null;
}

export function useCurrentUser() {
  const storeUser = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const setLoading = useUserStore((state) => state.setLoading);
  const clearUser = useUserStore((state) => state.clearUser);

  const { data, isLoading, isFetching, error } = useQuery<CurrentUser, unknown>(
    currentUserQueryOptions
  );

  const user = data ?? storeUser;
  const isLoadingUser = computeAuthLoading(isLoading, isFetching, data, storeUser);

  useEffect(() => {
    setLoading(isLoadingUser);
  }, [isLoadingUser, setLoading]);

  useEffect(() => {
    if (data) {
      setUser(data);
    } else if (error) {
      clearUser();
    }
  }, [data, error, setUser, clearUser]);

  return {
    user,
    isLoading: isLoadingUser,
    error,
  };
}

export function useUserRoleCode(): string | null {
  const storeRoleCode = useUserStore((state) => state.user?.roleCode ?? null);
  const { data: queryRoleCode } = useQuery({
    ...currentUserQueryOptions,
    select: (user) => user.roleCode ?? null,
  });

  return queryRoleCode ?? storeRoleCode;
}

export function useAuthLoading(): boolean {
  const storeUser = useUserStore((state) => state.user);
  const { isLoading, isFetching, data } = useQuery(currentUserQueryOptions);

  return computeAuthLoading(isLoading, isFetching, data, storeUser);
}
