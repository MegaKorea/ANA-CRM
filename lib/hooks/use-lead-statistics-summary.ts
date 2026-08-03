import { useMemo } from 'react';
import { buildLeadFunnelMetrics, type FunnelStepSource, type LeadFunnelMetrics } from '@/lib/utils/lead-funnel';
import type { LeadStatisticsChartRow, LeadStatisticsData } from '@/lib/hooks/use-lead-statistics';

export interface LeadStatisticsSummary {
  chartData: LeadStatisticsChartRow[];
  fbTotalSpend: number;
  fbTotalMessages: number;
  totalLeads: number;
  totalAppointments: number;
  totalArrived: number;
  funnel: LeadFunnelMetrics;
}

export function useLeadStatisticsSummary(
  data: LeadStatisticsData | undefined,
): LeadStatisticsSummary {
  return useMemo(() => {
    const chartData = data?.chartData ?? [];
    const fbTotalSpend = data?.fbTotalSpend ?? 0;
    const fbTotalMessages = data?.fbTotalMessages ?? 0;
    const totalLeads = data?.totalLeads ?? 0;
    const smaxTotalOrders = data?.smaxTotalOrders ?? 0;

    let totalAppointments = 0;
    let totalArrived = 0;
    for (const row of chartData) {
      totalAppointments += row.totalAppointments || 0;
      totalArrived += row.arrivedAppointments || 0;
    }

    const funnelSuccess = totalArrived > 0 ? totalArrived : smaxTotalOrders;
    const successSource: FunnelStepSource = totalArrived > 0 ? 'crm' : smaxTotalOrders > 0 ? 'smax' : 'crm';

    const funnel = buildLeadFunnelMetrics({
      messages: fbTotalMessages,
      data: totalLeads,
      appointments: totalAppointments,
      success: funnelSuccess,
      messagesSource: data?.messagesSource ?? 'crm',
      dataSource: data?.dataSource ?? 'crm',
      successSource,
    });

    return {
      chartData,
      fbTotalSpend,
      fbTotalMessages,
      totalLeads,
      totalAppointments,
      totalArrived,
      funnel,
    };
  }, [data]);
}
