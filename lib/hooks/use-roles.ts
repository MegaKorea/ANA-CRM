import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { Role } from '@/lib/services/role.service';

interface CreateRoleInput {
  name: string;
  code: string;
  description?: string;
}

interface UpdateRoleInput {
  name?: string;
  code?: string;
  description?: string;
}

export function useRoles() {
  return useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: () => api.get<Role[]>('/roles'),
  });
}

export function useRole(id: number) {
  return useQuery<Role>({
    queryKey: ['roles', id],
    queryFn: () => api.get<Role>(`/roles/${id}`),
    enabled: !!id,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation<Role, unknown, CreateRoleInput>({
    mutationFn: (input) => api.post<Role>('/roles', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation<Role, unknown, { id: number; input: UpdateRoleInput }>({
    mutationFn: ({ id, input }) => api.put<Role>(`/roles/${id}`, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles', variables.id] });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, number>({
    mutationFn: (id) => api.delete<void>(`/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}
