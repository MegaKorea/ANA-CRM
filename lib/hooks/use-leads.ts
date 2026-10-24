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

type LeadQueryData = PaginatedLeads | Lead | undefined;

function patchLeadQueryData(data: LeadQueryData, id: number, patch: Partial<Lead>): LeadQueryData {
  if (!data) return data;
  if ('data' in data && Array.isArray(data.data)) {
    return {
      ...data,
      data: data.data.map((lead) => (lead.id === id ? { ...lead, ...patch } : lead)),
    };
  }
  return (data as Lead).id === id ? { ...(data as Lead), ...patch } : data;
}

/**
 * Inline edits from the lead table (status, courses). The row is patched in
 * the cache right away and rolled back on error. Afterwards only the summary
 * counts (limit: 1) refetch; the table itself is just marked stale so the
 * edited row doesn't jump or vanish (e.g. status → converted) under the
 * cursor — it settles on the next filter/page change.
 */
export function useInlineUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation<
    Lead,
    unknown,
    { id: number; input: UpdateLeadInput },
    { snapshots: [readonly unknown[], LeadQueryData][] }
  >({
    mutationFn: ({ id, input }) => api.put<Lead>(`${LeadApiPath.BASE}/${id}`, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: [LeadQueryKey.LIST] });
      const snapshots = queryClient.getQueriesData<LeadQueryData>({
        queryKey: [LeadQueryKey.LIST],
      });
      queryClient.setQueriesData<LeadQueryData>({ queryKey: [LeadQueryKey.LIST] }, (data) =>
        patchLeadQueryData(data, id, input as Partial<Lead>),
      );
      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => {
      const isSummaryCount = (key: readonly unknown[]) =>
        (key[1] as { limit?: number } | undefined)?.limit === 1;
      queryClient.invalidateQueries({
        queryKey: [LeadQueryKey.LIST],
        predicate: (query) => isSummaryCount(query.queryKey),
      });
      queryClient.invalidateQueries({
        queryKey: [LeadQueryKey.LIST],
        predicate: (query) => !isSummaryCount(query.queryKey),
        refetchType: 'none',
      });
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
