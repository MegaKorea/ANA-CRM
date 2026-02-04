import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { Lead, LeadQueryParams } from '@/lib/services/lead.service';
import type { CreateLeadInput, UpdateLeadInput } from '@/lib/validators/lead.validator';

const LeadQueryKey = {
  LIST: 'leads',
} as const;

const LeadApiPath = {
  BASE: '/leads',
} as const;

export function useLeads(params?: LeadQueryParams) {
  return useQuery<Lead[]>({
    queryKey: [LeadQueryKey.LIST, params],
    queryFn: () =>
      api.get<Lead[]>(LeadApiPath.BASE, {
        params,
      }),
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation<Lead, unknown, CreateLeadInput>({
    mutationFn: (input) => api.post<Lead>(LeadApiPath.BASE, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LeadQueryKey.LIST] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation<Lead, unknown, { id: number; input: UpdateLeadInput }>({
    mutationFn: ({ id, input }) => api.put<Lead>(`${LeadApiPath.BASE}/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LeadQueryKey.LIST] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, number>({
    mutationFn: (id) => api.delete<void>(`${LeadApiPath.BASE}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LeadQueryKey.LIST] });
    },
  });
}
