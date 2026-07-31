import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserNotificationLimit } from '@/constants/enums';
import { fetchJson } from '@/lib/utils/fetchJson';
import type { UserNotification } from '@/lib/types/user-notification';

export const USER_NOTIFICATIONS_KEY = 'user-notifications';

type NotificationsResponse = {
  items: UserNotification[];
  unreadCount: number;
};

export function useMyNotifications(enabled: boolean) {
  return useQuery({
    queryKey: [USER_NOTIFICATIONS_KEY],
    queryFn: () => fetchJson<NotificationsResponse>('/api/notifications'),
    enabled,
    refetchInterval: UserNotificationLimit.POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<UserNotification>(`/api/notifications/${id}`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USER_NOTIFICATIONS_KEY] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => fetchJson<{ updated: number }>('/api/notifications', { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USER_NOTIFICATIONS_KEY] });
    },
  });
}
