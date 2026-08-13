export type LeadStatisticsChartRow = {
  date: string;
  totalLeads: number;
  registeredLeads: number;
  nurturingLeads: number;
  totalAppointments: number;
  arrivedAppointments: number;
  fbSpend?: number;
  fbMessages?: number;
};

export type LeadStatisticsSummaryDto = {
  registeredTotal: number;
};

export type LeadStatisticsApiResponse = {
  summary: LeadStatisticsSummaryDto;
  chartData: LeadStatisticsChartRow[];
};

export type LeadStatLeadRow = {
  id: number;
  created_at: string | null;
  updated_at: string | null;
  appointment_date: string | null;
  status: string | null;
  attendance_status: string | null;
};

export function emptyDayStats(date: string): LeadStatisticsChartRow {
  return {
    date,
    totalLeads: 0,
    registeredLeads: 0,
    nurturingLeads: 0,
    totalAppointments: 0,
    arrivedAppointments: 0,
  };
}
