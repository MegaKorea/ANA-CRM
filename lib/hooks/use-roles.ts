import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { Role, CreateRoleInput, UpdateRoleInput } from '@/lib/services/role.service';

const RoleQueryKey = {
  LIST: 'roles',
} as const;

const RoleApiPath = {
  BASE: '/roles',
} as const;

export function useRoles() {
  return useQuery<Role[]>({
    queryKey: [RoleQueryKey.LIST],
    queryFn: () => api.get<Role[]>(RoleApiPath.BASE),
  });
}

export function useRole(id: number) {
  return useQuery<Role>({
    queryKey: [RoleQueryKey.LIST, id],
    queryFn: () => api.get<Role>(`${RoleApiPath.BASE}/${id}`),
    enabled: !!id,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation<Role, unknown, CreateRoleInput>({
    mutationFn: (input) => api.post<Role>(RoleApiPath.BASE, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RoleQueryKey.LIST] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation<Role, unknown, { id: number; input: UpdateRoleInput }>({
    mutationFn: ({ id, input }) => api.put<Role>(`${RoleApiPath.BASE}/${id}`, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [RoleQueryKey.LIST] });
      queryClient.invalidateQueries({ queryKey: [RoleQueryKey.LIST, variables.id] });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, number>({
    mutationFn: (id) => api.delete<void>(`${RoleApiPath.BASE}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RoleQueryKey.LIST] });
    },
  });
}
