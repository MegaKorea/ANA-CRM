import { useQuery } from '@tanstack/react-query';

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

const FB_MESSAGE_ACTION_TYPE = 'onsite_conversion.messaging_conversation_started_7d';

async function fetchLeadStatistics(startDate: string, endDate: string) {
  const leadRes = await fetch(`/api/leads/statistics?startDate=${startDate}&endDate=${endDate}`);
  if (!leadRes.ok) {
    throw new Error('Failed to fetch lead statistics');
  }
  const leadData = await leadRes.json();

  let fbData: FacebookInsightRow[] = [];
  try {
    const fbRes = await fetch(`/api/facebook/insights?startDate=${startDate}&endDate=${endDate}`);
    if (fbRes.ok) {
      fbData = await fbRes.json();
    }
  } catch (fbErr) {
    console.warn('Facebook API error', fbErr);
  }

  let totalSpend = 0;
  let totalMessages = 0;
  const fbMap = new Map<string, { spend: number; messages: number }>();

  if (Array.isArray(fbData)) {
    fbData.forEach((row) => {
      const rowSpend = parseFloat(row.spend || '0');
      const messageAction = row.actions?.find((a) => a.action_type === FB_MESSAGE_ACTION_TYPE);
      const rowMessages = messageAction ? parseInt(messageAction.value || '0', 10) : 0;

      totalSpend += rowSpend;
      totalMessages += rowMessages;
      if (row.date_start) {
        const existing = fbMap.get(row.date_start) || { spend: 0, messages: 0 };
        existing.spend += rowSpend;
        existing.messages += rowMessages;
        fbMap.set(row.date_start, existing);
      }
    });
  }

  const chartData = (leadData.chartData as LeadStatisticsChartRow[]).map((row) => {
    const fbStats = fbMap.get(row.date);
    return {
      ...row,
      fbSpend: fbStats?.spend || 0,
      fbMessages: fbStats?.messages || 0,
    };
  });

  return {
    summary: leadData.summary as Record<string, unknown>,
    chartData,
    fbTotalSpend: totalSpend,
    fbTotalMessages: totalMessages,
  };
}

/** Merges lead statistics with Facebook ad insights for the given date range. */
export function useLeadStatistics(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['lead-statistics', startDate, endDate],
    queryFn: () => fetchLeadStatistics(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}
