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

  const flags: DaySources = {
    usedFacebookMessages: false,
    usedSmaxMessages: false,
    usedCrmLeads: false,
    usedSmaxLeads: false,
  };

  const chartData = leadData.chartData.map((row) => {
    const fb = fbByDay.get(row.date);
    const smaxDay = smaxByDay.get(row.date);

    const fbMessages = fb?.messages ?? 0;
    let messages = fbMessages;
    if (fbMessages > 0) {
      flags.usedFacebookMessages = true;
    } else {
      messages = smaxDay?.messages ?? smaxDay?.interactions ?? 0;
      if (messages > 0) flags.usedSmaxMessages = true;
    }

    const crmLeads = row.totalLeads || 0;
    let totalLeads = crmLeads;
    if (crmLeads > 0) {
      flags.usedCrmLeads = true;
    } else {
      totalLeads = smaxDay?.leads ?? 0;
      if (totalLeads > 0) flags.usedSmaxLeads = true;
    }

    return {
      ...row,
      totalLeads,
      fbSpend: fb?.spend ?? 0,
      fbMessages: messages,
    };
  });

  const fbTotalMessages = chartData.reduce(
    (acc, row) => acc + (row.fbMessages || 0),
    0,
  );
  const chartLeadTotal = chartData.reduce(
    (acc, row) => acc + (row.totalLeads || 0),
    0,
  );
  const totalLeads = chartLeadTotal > 0 ? chartLeadTotal : (smax?.data ?? 0);

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
    dataSource: resolveSource(
      flags.usedCrmLeads,
      flags.usedSmaxLeads || totalLeads > 0,
      'crm',
      'smax',
    ),
    smaxTotalOrders: smax?.orders ?? 0,
  };
}
