import type { FunnelStepSource, LeadFunnelMetrics } from '@/lib/utils/lead-funnel';
import { buildLeadFunnelMetrics } from '@/lib/utils/lead-funnel';
import type {
  LeadStatisticsChartRow,
} from '@/lib/lead-statistics/types';
import type { MergedLeadStatistics } from '@/lib/lead-statistics/merge-sources';

export type LeadStatisticsSummaryView = {
  chartData: LeadStatisticsChartRow[];
  fbTotalSpend: number;
  fbTotalMessages: number;
  totalLeads: number;
  totalAppointments: number;
  totalArrived: number;
  totalNurturing: number;
  funnel: LeadFunnelMetrics;
};

function sumChart(chartData: LeadStatisticsChartRow[]) {
  let totalAppointments = 0;
  let totalArrived = 0;
  let registeredFromChart = 0;
  let totalNurturing = 0;
  for (const row of chartData) {
    totalAppointments += row.totalAppointments || 0;
    totalArrived += row.arrivedAppointments || 0;
    registeredFromChart += row.registeredLeads || 0;
    totalNurturing += row.nurturingLeads || 0;
  }
  return { totalAppointments, totalArrived, registeredFromChart, totalNurturing };
}

function resolveSuccess(
  registeredTotal: number | undefined,
  registeredFromChart: number,
  smaxOrders: number,
): { success: number; source: FunnelStepSource } {
  const crm =
    typeof registeredTotal === 'number' ? registeredTotal : registeredFromChart;
  if (crm > 0) return { success: crm, source: 'crm' };
  if (smaxOrders > 0) return { success: smaxOrders, source: 'smax' };
  return { success: 0, source: 'crm' };
}

export function buildLeadStatisticsSummary(
  data: MergedLeadStatistics | undefined,
): LeadStatisticsSummaryView {
  const chartData = data?.chartData ?? [];
  const { totalAppointments, totalArrived, registeredFromChart, totalNurturing } =
    sumChart(chartData);

  const { success, source: successSource } = resolveSuccess(
    data?.summary?.registeredTotal,
    registeredFromChart,
    data?.smaxTotalOrders ?? 0,
  );

  return {
    chartData,
    fbTotalSpend: data?.fbTotalSpend ?? 0,
    fbTotalMessages: data?.fbTotalMessages ?? 0,
    totalLeads: data?.totalLeads ?? 0,
    totalAppointments,
    totalArrived,
    totalNurturing,
    funnel: buildLeadFunnelMetrics({
      messages: data?.fbTotalMessages ?? 0,
      data: data?.totalLeads ?? 0,
      appointments: totalAppointments,
      success,
      messagesSource: data?.messagesSource ?? 'crm',
      dataSource: data?.dataSource ?? 'crm',
      successSource,
    }),
  };
}
