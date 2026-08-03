import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { SmaxApiPath } from '@/constants/smax';
import type { SmaxStatisticsApiResponse } from '@/lib/smax/types';
import type { FunnelStepSource } from '@/lib/utils/lead-funnel';

export interface LeadStatisticsChartRow {
  date: string;
  totalLeads: number;
  registeredLeads: number;
  totalAppointments: number;
  arrivedAppointments: number;
  fbSpend?: number;
  fbMessages?: number;
}

interface FacebookInsightRow {
  spend: string;
  campaign_id: string;
  account_name: string;
  campaign_name: string;
  actions: { action_type: string; value: string }[];
  date_start: string;
  date_stop: string;
}

export interface LeadStatisticsData {
  summary: Record<string, unknown>;
  chartData: LeadStatisticsChartRow[];
  fbTotalSpend: number;
  fbTotalMessages: number;
  messagesSource: FunnelStepSource;
  totalLeads: number;
  dataSource: FunnelStepSource;
  smaxTotalOrders: number;
}

const FB_MESSAGE_ACTION_TYPE = 'onsite_conversion.messaging_conversation_started_7d';

async function fetchLeadChartData(startDate: string, endDate: string) {
  const res = await fetch(
    `/api/leads/statistics?startDate=${startDate}&endDate=${endDate}`,
  );
  if (!res.ok) {
    throw new Error('Failed to fetch lead statistics');
  }
  return res.json();
}

async function fetchFacebookInsights(
  startDate: string,
  endDate: string,
): Promise<FacebookInsightRow[]> {
  try {
    const res = await fetch(
      `/api/facebook/insights?startDate=${startDate}&endDate=${endDate}`,
    );
    return res.ok ? await res.json() : [];
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
  const [leadData, fbData, smax] = await Promise.all([
    fetchLeadChartData(startDate, endDate),
    fetchFacebookInsights(startDate, endDate),
    fetchSmaxStatisticsSafe(startDate, endDate),
  ]);

  let totalSpend = 0;
  const fbMap = new Map<string, { spend: number; messages: number }>();

  if (Array.isArray(fbData)) {
    fbData.forEach((row) => {
      const rowSpend = parseFloat(row.spend || '0');
      const messageAction = row.actions?.find(
        (a) => a.action_type === FB_MESSAGE_ACTION_TYPE,
      );
      const rowMessages = messageAction
        ? parseInt(messageAction.value || '0', 10)
        : 0;

      totalSpend += rowSpend;
      if (row.date_start) {
        const existing = fbMap.get(row.date_start) || { spend: 0, messages: 0 };
        existing.spend += rowSpend;
        existing.messages += rowMessages;
        fbMap.set(row.date_start, existing);
      }
    });
  }

  const smaxMap = new Map(
    (smax?.calendars ?? []).map((day) => [day.date, day]),
  );

  // Track, per metric, which source actually contributed a value on at
  // least one day — this is the single place that decides "SMAX vs CRM vs
  // Facebook vs mixed" for messages/data, so the UI label never drifts from
  // the numbers it's labeling.
  let usedFacebookMessages = false;
  let usedSmaxMessages = false;
  let usedCrmLeads = false;
  let usedSmaxLeads = false;

  const chartData = (leadData.chartData as LeadStatisticsChartRow[]).map(
    (row) => {
      const fbStats = fbMap.get(row.date);
      const smaxDay = smaxMap.get(row.date);

      const fbMessages = fbStats?.messages || 0;
      let messages = fbMessages;
      if (fbMessages > 0) {
        usedFacebookMessages = true;
      } else {
        messages = smaxDay?.messages ?? smaxDay?.interactions ?? 0;
        if (messages > 0) usedSmaxMessages = true;
      }

      const crmLeads = row.totalLeads || 0;
      let totalLeads = crmLeads;
      if (crmLeads > 0) {
        usedCrmLeads = true;
      } else {
        totalLeads = smaxDay?.leads ?? 0;
        if (totalLeads > 0) usedSmaxLeads = true;
      }

      return {
        ...row,
        totalLeads,
        fbSpend: fbStats?.spend || 0,
        fbMessages: messages,
      };
    },
  );

  const fbTotalMessages = chartData.reduce((acc, row) => acc + (row.fbMessages || 0), 0);
  const messagesSource: FunnelStepSource =
    usedFacebookMessages && usedSmaxMessages
      ? 'mixed'
      : usedFacebookMessages
        ? 'facebook'
        : usedSmaxMessages
          ? 'smax'
          : 'crm';

  const crmTotalLeads = chartData.reduce((acc, row) => acc + (row.totalLeads || 0), 0);
  // Only fall back to the SMAX range-dedup total when CRM has nothing at
  // all for the range — keeps this number in sync with the table's own
  // "Tổng cộng" row (sum of the totalLeads column) in the common case.
  const totalLeads = crmTotalLeads > 0 ? crmTotalLeads : (smax?.data ?? 0);
  const dataSource: FunnelStepSource =
    usedCrmLeads && usedSmaxLeads
      ? 'mixed'
      : usedCrmLeads
        ? 'crm'
        : usedSmaxLeads || totalLeads > 0
          ? 'smax'
          : 'crm';

  return {
    summary: leadData.summary as Record<string, unknown>,
    chartData,
    fbTotalSpend: totalSpend,
    fbTotalMessages,
    messagesSource,
    totalLeads,
    dataSource,
    smaxTotalOrders: smax?.orders ?? 0,
  };
}

export function useLeadStatistics(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['lead-statistics', startDate, endDate],
    queryFn: () => fetchLeadStatistics(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}
