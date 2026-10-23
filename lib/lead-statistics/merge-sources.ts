import type { FunnelStepSource } from '@/lib/utils/lead-funnel';
import type { SmaxStatisticsApiResponse } from '@/lib/smax/types';
import type {
  LeadStatisticsApiResponse,
  LeadStatisticsChartRow,
} from '@/lib/lead-statistics/types';

const FB_MESSAGE_ACTION_TYPE =
  'onsite_conversion.messaging_conversation_started_7d';

export type FacebookInsightRow = {
  spend: string;
  actions?: { action_type: string; value: string }[];
  date_start?: string;
};

export type MergedLeadStatistics = {
  summary: LeadStatisticsApiResponse['summary'];
  chartData: LeadStatisticsChartRow[];
  fbTotalSpend: number;
  fbTotalMessages: number;
  messagesSource: FunnelStepSource;
  totalLeads: number;
  dataSource: FunnelStepSource;
  smaxTotalOrders: number;
  smaxNewCustomers: number;
  nurturingTotal: number;
};

type DaySources = {
  usedFacebookMessages: boolean;
  usedSmaxMessages: boolean;
  usedCrmLeads: boolean;
  usedSmaxLeads: boolean;
};

function resolveSource(
  primary: boolean,
  secondary: boolean,
  primaryName: FunnelStepSource,
  secondaryName: FunnelStepSource,
  fallback: FunnelStepSource = 'crm',
): FunnelStepSource {
  if (primary && secondary) return 'mixed';
  if (primary) return primaryName;
  if (secondary) return secondaryName;
  return fallback;
}

function indexFacebookByDay(rows: FacebookInsightRow[]) {
  let totalSpend = 0;
  const byDay = new Map<string, { spend: number; messages: number }>();

  for (const row of rows) {
    const spend = parseFloat(row.spend || '0') || 0;
    const messageAction = row.actions?.find(
      (a) => a.action_type === FB_MESSAGE_ACTION_TYPE,
    );
    const messages = messageAction
      ? parseInt(messageAction.value || '0', 10) || 0
      : 0;

    totalSpend += spend;
    if (!row.date_start) continue;

    const existing = byDay.get(row.date_start) ?? { spend: 0, messages: 0 };
    existing.spend += spend;
    existing.messages += messages;
    byDay.set(row.date_start, existing);
  }

  return { totalSpend, byDay };
}

export function mergeLeadStatisticsSources(input: {
  leadData: LeadStatisticsApiResponse;
  facebook: FacebookInsightRow[];
  smax: SmaxStatisticsApiResponse | null;
}): MergedLeadStatistics {
  const { leadData, facebook, smax } = input;
  const { totalSpend, byDay: fbByDay } = indexFacebookByDay(facebook);
  const smaxByDay = new Map((smax?.calendars ?? []).map((day) => [day.date, day]));

  // Decide the source ONCE for the whole date range, not per day — otherwise
  // a single real zero-lead day inside the range would silently borrow SMAX's
  // (differently-defined) count for that day, mixing two incompatible totals.
  const crmLeadsInRange = leadData.chartData.some((row) => (row.totalLeads || 0) > 0);
  // SMAX counts every inbound conversation (organic + ads); Facebook's
  // `messaging_conversation_started` only counts ad-driven ones. Prefer SMAX
  // whenever it responded so the current and previous periods are always
  // measured with the same source — otherwise one FB ad message in the range
  // flipped the whole range to FB (e.g. 1 vs 83 "so với kỳ trước").
  const fbMessagesInRange =
    !smax && fbByDay.size > 0 && [...fbByDay.values()].some((d) => d.messages > 0);

  const flags: DaySources = {
    usedFacebookMessages: fbMessagesInRange,
    usedSmaxMessages: !fbMessagesInRange,
    usedCrmLeads: crmLeadsInRange,
    usedSmaxLeads: !crmLeadsInRange,
  };

  const chartData = leadData.chartData.map((row) => {
    const fb = fbByDay.get(row.date);
    const smaxDay = smaxByDay.get(row.date);

    const messages = fbMessagesInRange
      ? (fb?.messages ?? 0)
      : (smaxDay?.messages ?? smaxDay?.interactions ?? 0);

    const totalLeads = crmLeadsInRange ? row.totalLeads || 0 : (smaxDay?.leads ?? 0);

    return {
      ...row,
      totalLeads,
      fbSpend: fb?.spend ?? 0,
      fbMessages: messages,
    };
  });

  const chartMessageTotal = chartData.reduce(
    (acc, row) => acc + (row.fbMessages || 0),
    0,
  );
  // Use SMAX's own range total rather than summing calendar buckets: bucket
  // granularity depends on key_time (hourly / daily / custom) and may not line
  // up 1:1 with the CRM's VN-day chart rows.
  const fbTotalMessages =
    !fbMessagesInRange && smax ? Math.max(smax.messages, chartMessageTotal) : chartMessageTotal;
  const chartLeadTotal = chartData.reduce(
    (acc, row) => acc + (row.totalLeads || 0),
    0,
  );
  const totalLeads = crmLeadsInRange ? chartLeadTotal : (smax?.data ?? 0);

  return {
    summary: leadData.summary,
    chartData,
    fbTotalSpend: totalSpend,
    fbTotalMessages,
    messagesSource: resolveSource(
      flags.usedFacebookMessages,
      flags.usedSmaxMessages,
      'facebook',
      'smax',
    ),
    totalLeads,
    dataSource: resolveSource(flags.usedCrmLeads, flags.usedSmaxLeads, 'crm', 'smax'),
    smaxTotalOrders: smax?.orders ?? 0,
    smaxNewCustomers: smax?.newCustomers ?? 0,
    nurturingTotal: leadData.summary.nurturingTotal,
  };
}
