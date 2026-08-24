import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { Lead, LeadQueryParams, PaginatedLeads } from '@/lib/services/lead.service';
import type { CreateLeadInput, UpdateLeadInput } from '@/lib/validators/lead.validator';

const LeadQueryKey = {
  LIST: 'leads',
} as const;

const LeadApiPath = {
  BASE: '/leads',
} as const;

export function useLeads(params?: LeadQueryParams) {
  return useQuery<PaginatedLeads>({
    queryKey: [LeadQueryKey.LIST, params],
    queryFn: () =>
      api.get<PaginatedLeads>(LeadApiPath.BASE, {
        params,
      }),
    staleTime: 30 * 1000, // 30s – avoid refetch on every render
    placeholderData: (prev) => prev, // keep previous data while fetching new page
  });
}

export function useLead(id: number | null) {
  return useQuery<Lead>({
    queryKey: [LeadQueryKey.LIST, 'detail', id],
    queryFn: () => api.get<Lead>(`${LeadApiPath.BASE}/${id}`),
    enabled: id != null,
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

export function useAddLeadNoteSummarize() {
  const queryClient = useQueryClient();

  return useMutation<Lead, unknown, { id: number; url: string; mime_type?: string }>({
    mutationFn: ({ id, url, mime_type }) =>
      api.post<Lead>(`${LeadApiPath.BASE}/${id}/note-summarize`, { url, mime_type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LeadQueryKey.LIST] });
    },
  });
}

export function useAssignTelesales() {
  const queryClient = useQueryClient();

  return useMutation<Lead, unknown, { leadId: number; telesales_id: string | null }>({
    mutationFn: ({ leadId, telesales_id }) =>
      api.patch<Lead>(`${LeadApiPath.BASE}/${leadId}/telesales`, { telesales_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LeadQueryKey.LIST] });
    },
  });
}
