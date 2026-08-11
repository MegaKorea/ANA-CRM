import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type {
  Enrollment,
  PaginatedEnrollments,
  EnrollmentRevenueSummary,
} from '@/lib/services/enrollment.service';
import type {
  CreateEnrollmentInput,
  UpdateEnrollmentInput,
  EnrollmentQueryParams,
} from '@/lib/validators/enrollment.validator';

const EnrollmentQueryKey = {
  LIST: 'enrollments',
  LEAD_IDS: 'enrollment-lead-ids',
  REVENUE: 'enrollment-revenue',
} as const;

const EnrollmentApiPath = {
  BASE: '/enrollments',
} as const;

export function useEnrollments(params?: EnrollmentQueryParams) {
  return useQuery<PaginatedEnrollments>({
    queryKey: [EnrollmentQueryKey.LIST, params],
    queryFn: () => api.get<PaginatedEnrollments>(EnrollmentApiPath.BASE, { params }),
    staleTime: 15 * 1000,
    placeholderData: (prev) => prev,
  });
}

/** Just the lead_ids that already have an enrollment — cheap membership check, no row enrichment. */
export function useEnrolledLeadIds() {
  return useQuery<{ data: number[] }>({
    queryKey: [EnrollmentQueryKey.LEAD_IDS],
    queryFn: () => api.get<{ data: number[] }>(`${EnrollmentApiPath.BASE}/lead-ids`),
    staleTime: 15 * 1000,
  });
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient();

  return useMutation<Enrollment, unknown, CreateEnrollmentInput>({
    mutationFn: (input) => api.post<Enrollment>(EnrollmentApiPath.BASE, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EnrollmentQueryKey.LIST] });
      queryClient.invalidateQueries({ queryKey: [EnrollmentQueryKey.LEAD_IDS] });
    },
  });
}

export function useEnsureEnrollmentForLead() {
  const queryClient = useQueryClient();

  return useMutation<Enrollment, unknown, CreateEnrollmentInput>({
    mutationFn: (input) => api.post<Enrollment>(`${EnrollmentApiPath.BASE}/ensure`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EnrollmentQueryKey.LIST] });
      queryClient.invalidateQueries({ queryKey: [EnrollmentQueryKey.LEAD_IDS] });
    },
  });
}

export function useUpdateEnrollment() {
  const queryClient = useQueryClient();

  return useMutation<Enrollment, unknown, { id: number; input: UpdateEnrollmentInput }>({
    mutationFn: ({ id, input }) => api.put<Enrollment>(`${EnrollmentApiPath.BASE}/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EnrollmentQueryKey.LIST] });
    },
  });
}

export function useEnrollmentRevenue(startDate: string, endDate: string) {
  return useQuery<EnrollmentRevenueSummary>({
    queryKey: [EnrollmentQueryKey.REVENUE, startDate, endDate],
    queryFn: () =>
      api.get<EnrollmentRevenueSummary>('/reports/enrollment-revenue', {
        params: { startDate, endDate },
      }),
    enabled: !!startDate && !!endDate,
    staleTime: 15 * 1000,
  });
}

export function useDeleteEnrollment() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, number>({
    mutationFn: (id) => api.delete<void>(`${EnrollmentApiPath.BASE}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EnrollmentQueryKey.LIST] });
      queryClient.invalidateQueries({ queryKey: [EnrollmentQueryKey.LEAD_IDS] });
    },
  });
}
