import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type {
  PaymentTicket,
  PaginatedPaymentTickets,
  PaymentSummary,
} from '@/lib/services/payment-ticket.service';
import type {
  CreatePaymentTicketInput,
  ReviewPaymentTicketInput,
  PaymentTicketQueryParams,
} from '@/lib/validators/payment-ticket.validator';

const PaymentTicketQueryKey = {
  LIST: 'payment-tickets',
  BY_LEAD: 'payment-tickets-by-lead',
  SUMMARY: 'payment-summary',
} as const;

const PaymentTicketApiPath = {
  BASE: '/payment-tickets',
  SUMMARY: '/payment-tickets/summary',
} as const;

export function usePaymentTickets(params?: PaymentTicketQueryParams) {
  return useQuery<PaginatedPaymentTickets>({
    queryKey: [PaymentTicketQueryKey.LIST, params],
    queryFn: () =>
      api.get<PaginatedPaymentTickets>(PaymentTicketApiPath.BASE, { params }),
    staleTime: 15 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function usePaymentTicketsByLead(leadId: number | undefined) {
  return useQuery<PaymentTicket[]>({
    queryKey: [PaymentTicketQueryKey.BY_LEAD, leadId],
    queryFn: () =>
      api
        .get<PaginatedPaymentTickets>(PaymentTicketApiPath.BASE, {
          params: { lead_id: leadId },
        })
        .then((r) => r.data),
    enabled: !!leadId,
    staleTime: 15 * 1000,
  });
}

export function useCreatePaymentTicket() {
  const queryClient = useQueryClient();

  return useMutation<PaymentTicket, unknown, CreatePaymentTicketInput>({
    mutationFn: (input) =>
      api.post<PaymentTicket>(PaymentTicketApiPath.BASE, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [PaymentTicketQueryKey.LIST],
      });
      queryClient.invalidateQueries({
        queryKey: [PaymentTicketQueryKey.BY_LEAD, variables.lead_id],
      });
      queryClient.invalidateQueries({
        queryKey: [PaymentTicketQueryKey.SUMMARY, variables.lead_id],
      });
    },
  });
}

export function useReviewPaymentTicket() {
  const queryClient = useQueryClient();

  return useMutation<
    PaymentTicket,
    unknown,
    { id: number; input: ReviewPaymentTicketInput }
  >({
    mutationFn: ({ id, input }) =>
      api.patch<PaymentTicket>(
        `${PaymentTicketApiPath.BASE}/${id}/review`,
        input
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [PaymentTicketQueryKey.LIST],
      });
      queryClient.invalidateQueries({
        queryKey: [PaymentTicketQueryKey.BY_LEAD],
      });
      queryClient.invalidateQueries({
        queryKey: [PaymentTicketQueryKey.SUMMARY],
      });
    },
  });
}

export function usePaymentSummary(leadId: number | undefined) {
  return useQuery<PaymentSummary>({
    queryKey: [PaymentTicketQueryKey.SUMMARY, leadId],
    queryFn: () =>
      api.get<PaymentSummary>(`${PaymentTicketApiPath.SUMMARY}/${leadId}`),
    enabled: !!leadId,
    staleTime: 15 * 1000,
  });
}

/**
 * Batch-fetch the number of APPROVED payment tickets per lead.
 * Returns a map of { [leadId: string]: number }.
 */
export function usePaymentCounts(leadIds: number[]) {
  const key = leadIds.slice().sort().join(',');
  return useQuery<Record<string, number>>({
    queryKey: ['payment-counts', key],
    queryFn: () =>
      api.get<Record<string, number>>('/payment-tickets/counts', {
        params: { lead_ids: key },
      }),
    enabled: leadIds.length > 0,
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  });
}

