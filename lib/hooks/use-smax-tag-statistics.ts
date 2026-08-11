import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { SmaxApiPath, SmaxQueryKey } from '@/constants/smax';
import type { SmaxTagStatisticsApiResponse } from '@/lib/smax/types';

export function useSmaxTagStatistics(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [SmaxQueryKey.TAGS, startDate, endDate],
    enabled: !!startDate && !!endDate,
    queryFn: () =>
      api.get<SmaxTagStatisticsApiResponse>(SmaxApiPath.TAGS, {
        params: { startDate, endDate },
      }),
  });
}
