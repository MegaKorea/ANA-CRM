import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { SmaxApiPath } from '@/constants/smax';
import type { SmaxStatisticsApiResponse } from '@/lib/smax/types';
import type { LeadStatisticsApiResponse } from '@/lib/lead-statistics/types';
import {
  mergeLeadStatisticsSources,
  type FacebookInsightRow,
  type MergedLeadStatistics,
} from '@/lib/lead-statistics/merge-sources';

export type {
  LeadStatisticsChartRow,
  LeadStatisticsApiResponse,
} from '@/lib/lead-statistics/types';

export type LeadStatisticsData = MergedLeadStatistics;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${url}`);
  return res.json() as Promise<T>;
}

async function fetchLeadChartData(startDate: string, endDate: string) {
  return fetchJson<LeadStatisticsApiResponse>(
    `/api/leads/statistics?startDate=${startDate}&endDate=${endDate}`,
  );
}

async function fetchFacebookInsights(
  startDate: string,
  endDate: string,
): Promise<FacebookInsightRow[]> {
  try {
    const res = await fetch(
      `/api/facebook/insights?startDate=${startDate}&endDate=${endDate}`,
    );
    return res.ok ? ((await res.json()) as FacebookInsightRow[]) : [];
  } catch (err) {
    console.warn('Facebook API error', err);
    return [];
  }
}

async function fetchSmaxStatisticsSafe(
  startDate: string,
  endDate: string,
): Promise<SmaxStatisticsApiResponse | null> {
  try {
    return await api.get<SmaxStatisticsApiResponse>(SmaxApiPath.STATISTICS, {
      params: { startDate, endDate },
    });
  } catch (err) {
    console.warn('SMAX statistics API error', err);
    return null;
  }
}

async function fetchLeadStatistics(
  startDate: string,
  endDate: string,
): Promise<LeadStatisticsData> {
  const [leadData, facebook, smax] = await Promise.all([
    fetchLeadChartData(startDate, endDate),
    fetchFacebookInsights(startDate, endDate),
    fetchSmaxStatisticsSafe(startDate, endDate),
  ]);

  return mergeLeadStatisticsSources({ leadData, facebook, smax });
}

export function useLeadStatistics(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['lead-statistics', startDate, endDate],
    queryFn: () => fetchLeadStatistics(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}
