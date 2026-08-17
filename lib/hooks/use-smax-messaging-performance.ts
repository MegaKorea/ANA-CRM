import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { SmaxApiPath, SmaxQueryKey } from '@/constants/smax';
import type { SmaxMessagingPerformanceApiResponse } from '@/lib/smax/types';

export function useSmaxMessagingPerformance(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [SmaxQueryKey.MESSAGING_PERFORMANCE, startDate, endDate],
    enabled: !!startDate && !!endDate,
    queryFn: () =>
      api.get<SmaxMessagingPerformanceApiResponse>(SmaxApiPath.MESSAGING_PERFORMANCE, {
        params: { startDate, endDate },
      }),
  });
}
