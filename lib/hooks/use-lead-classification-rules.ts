import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type {
  LeadClassificationRule,
  CreateLeadClassificationRuleInput,
  UpdateLeadClassificationRuleInput,
} from '@/lib/services/lead-classification-rule.service';

const LeadClassificationRuleQueryKey = {
  LIST: 'lead-classification-rules',
} as const;

const LeadClassificationRuleApiPath = {
  BASE: '/lead-classification-rules',
} as const;

export function useLeadClassificationRules() {
  return useQuery<LeadClassificationRule[]>({
    queryKey: [LeadClassificationRuleQueryKey.LIST],
    queryFn: () => api.get<LeadClassificationRule[]>(LeadClassificationRuleApiPath.BASE),
  });
}

export function useCreateLeadClassificationRule() {
  const queryClient = useQueryClient();

  return useMutation<LeadClassificationRule, unknown, CreateLeadClassificationRuleInput>({
    mutationFn: (input) =>
      api.post<LeadClassificationRule>(LeadClassificationRuleApiPath.BASE, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LeadClassificationRuleQueryKey.LIST] });
    },
  });
}

export function useUpdateLeadClassificationRule() {
  const queryClient = useQueryClient();

  return useMutation<
    LeadClassificationRule,
    unknown,
    { id: number; input: UpdateLeadClassificationRuleInput }
  >({
    mutationFn: ({ id, input }) =>
      api.put<LeadClassificationRule>(`${LeadClassificationRuleApiPath.BASE}/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LeadClassificationRuleQueryKey.LIST] });
    },
  });
}

export function useDeleteLeadClassificationRule() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, number>({
    mutationFn: (id) => api.delete<void>(`${LeadClassificationRuleApiPath.BASE}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LeadClassificationRuleQueryKey.LIST] });
    },
  });
}

export function useDuplicateLeadClassificationRule() {
  const queryClient = useQueryClient();

  return useMutation<LeadClassificationRule, unknown, number>({
    mutationFn: (id) =>
      api.post<LeadClassificationRule>(`${LeadClassificationRuleApiPath.BASE}/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LeadClassificationRuleQueryKey.LIST] });
    },
  });
}

export function useActivateLeadClassificationRule() {
  const queryClient = useQueryClient();

  return useMutation<LeadClassificationRule, unknown, number>({
    mutationFn: (id) =>
      api.post<LeadClassificationRule>(`${LeadClassificationRuleApiPath.BASE}/${id}/activate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LeadClassificationRuleQueryKey.LIST] });
    },
  });
}
