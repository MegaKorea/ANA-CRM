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
  /** Snapshot count of leads currently in "nurturing" status — not scoped to the queried date range, since it's a current pipeline state, not a period event. */
  nurturingTotal: number;
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

/** Enrollment of an imported lead — dated by its real enrollment_date, since the lead's own created_at is just the import timestamp. */
export type ImportedEnrollmentRow = {
  lead_id: number;
  enrollment_date: string | null;
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
