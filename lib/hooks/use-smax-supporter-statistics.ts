import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { SmaxApiPath, SmaxQueryKey } from '@/constants/smax';
import type { SmaxSupporterStatisticsApiResponse } from '@/lib/smax/types';

export function useSmaxSupporterStatistics(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [SmaxQueryKey.SUPPORTERS, startDate, endDate],
    enabled: !!startDate && !!endDate,
    queryFn: () =>
      api.get<SmaxSupporterStatisticsApiResponse>(SmaxApiPath.SUPPORTERS, {
        params: { startDate, endDate },
      }),
  });
}
