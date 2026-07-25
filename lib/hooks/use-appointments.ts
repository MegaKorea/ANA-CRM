import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import type { LeadAppointment, DueAppointment } from '@/lib/services/appointment.service';
import type {
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '@/lib/validators/appointment.validator';

const AppointmentQueryKey = {
  BY_LEAD: 'appointments-by-lead',
  REMINDERS: 'appointment-reminders',
} as const;

const AppointmentApiPath = {
  BASE: '/appointments',
  REMINDERS: '/appointments/reminders',
  BY_LEAD: (leadId: number) => `/leads/${leadId}/appointments`,
} as const;

/** How often the shell asks the server for due reminders. */
const REMINDER_POLL_INTERVAL_MS = 60 * 1000;

export function useAppointmentsByLead(leadId: number | undefined) {
  return useQuery<LeadAppointment[]>({
    queryKey: [AppointmentQueryKey.BY_LEAD, leadId],
    queryFn: () => api.get<LeadAppointment[]>(AppointmentApiPath.BY_LEAD(leadId as number)),
    enabled: !!leadId,
    staleTime: 15 * 1000,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation<
    LeadAppointment,
    unknown,
    { leadId: number; input: Omit<CreateAppointmentInput, 'lead_id'> }
  >({
    mutationFn: ({ leadId, input }) =>
      api.post<LeadAppointment>(AppointmentApiPath.BY_LEAD(leadId), input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [AppointmentQueryKey.BY_LEAD, variables.leadId],
      });
      // The lead row mirrors its next appointment, so refresh the lead list too.
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation<
    LeadAppointment,
    unknown,
    { id: number; leadId: number; input: UpdateAppointmentInput }
  >({
    mutationFn: ({ id, input }) =>
      api.patch<LeadAppointment>(`${AppointmentApiPath.BASE}/${id}`, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [AppointmentQueryKey.BY_LEAD, variables.leadId],
      });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, { id: number; leadId: number }>({
    mutationFn: ({ id }) => api.delete<void>(`${AppointmentApiPath.BASE}/${id}`),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [AppointmentQueryKey.BY_LEAD, variables.leadId],
      });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

/**
 * Polls for appointments whose reminder is due for the signed-in telesales.
 *
 * `enabled` lets the shell skip polling until a user is loaded. When the app is
 * later moved behind a cron job this hook keeps working unchanged — the server
 * simply gains a second writer for the same rows.
 */
export function useDueReminders(enabled: boolean) {
  return useQuery<DueAppointment[]>({
    queryKey: [AppointmentQueryKey.REMINDERS],
    queryFn: () => api.get<DueAppointment[]>(AppointmentApiPath.REMINDERS),
    enabled,
    refetchInterval: REMINDER_POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}

/** Acknowledges reminders so the server stops returning them. */
export function useMarkRemindersSent() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; count: number }, unknown, number[]>({
    mutationFn: (ids) =>
      api.post<{ success: boolean; count: number }>(AppointmentApiPath.REMINDERS, { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AppointmentQueryKey.REMINDERS] });
    },
  });
}
