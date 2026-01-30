import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { User } from '@/lib/services/user.service';
import type { CreateUserInput, UpdateUserInput } from '@/lib/validators/user.validator';

const UserQueryKey = {
  LIST: 'users',
} as const;

const UserApiPath = {
  BASE: '/users',
} as const;

export function useUsers() {
  return useQuery<User[]>({
    queryKey: [UserQueryKey.LIST],
    queryFn: () => api.get<User[]>(UserApiPath.BASE),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation<User, unknown, CreateUserInput>({
    mutationFn: (input) => api.post<User>(UserApiPath.BASE, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UserQueryKey.LIST] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation<User, unknown, { id: number; input: UpdateUserInput }>({
    mutationFn: ({ id, input }) => api.put<User>(`${UserApiPath.BASE}/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UserQueryKey.LIST] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, number>({
    mutationFn: (id) => api.delete<void>(`${UserApiPath.BASE}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [UserQueryKey.LIST] });
    },
  });
}

