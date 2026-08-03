import { useMemo } from 'react';
import {
  buildLeadStatisticsSummary,
  type LeadStatisticsSummaryView,
} from '@/lib/lead-statistics/build-summary';
import type { LeadStatisticsData } from '@/lib/hooks/use-lead-statistics';

export type LeadStatisticsSummary = LeadStatisticsSummaryView;

export function useLeadStatisticsSummary(
  data: LeadStatisticsData | undefined,
): LeadStatisticsSummary {
  return useMemo(() => buildLeadStatisticsSummary(data), [data]);
}
