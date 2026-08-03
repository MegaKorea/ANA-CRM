import { AttendanceStatus, LeadStatus } from '@/constants/enums';
import {
  eachDateInclusive,
  toVnDate,
} from '@/lib/utils/vn-date';
import {
  emptyDayStats,
  type LeadStatLeadRow,
  type LeadStatisticsApiResponse,
  type LeadStatisticsChartRow,
} from '@/lib/lead-statistics/types';

export function aggregateLeadStatistics(
  startDate: string,
  endDate: string,
  leads: LeadStatLeadRow[],
): LeadStatisticsApiResponse {
  const dateMap = new Map<string, LeadStatisticsChartRow>();
  for (const date of eachDateInclusive(startDate, endDate)) {
    dateMap.set(date, emptyDayStats(date));
  }

  const registeredIds = new Set<number>();

  for (const lead of leads) {
    bumpCreated(dateMap, lead);
    bumpRegistered(dateMap, registeredIds, lead);
    bumpAppointment(dateMap, lead);
  }

  return {
    summary: { registeredTotal: registeredIds.size },
    chartData: Array.from(dateMap.values()),
  };
}

function bumpCreated(
  dateMap: Map<string, LeadStatisticsChartRow>,
  lead: LeadStatLeadRow,
): void {
  if (!lead.created_at) return;
  const day = toVnDate(lead.created_at);
  const row = dateMap.get(day);
  if (row) row.totalLeads += 1;
}

function bumpRegistered(
  dateMap: Map<string, LeadStatisticsChartRow>,
  registeredIds: Set<number>,
  lead: LeadStatLeadRow,
): void {
  if (lead.status !== LeadStatus.CONVERTED || registeredIds.has(lead.id)) return;

  const createdDay = lead.created_at ? toVnDate(lead.created_at) : null;
  const createdInRange = createdDay != null && dateMap.has(createdDay);

  let bucket: string | null = null;
  if (createdInRange) {
    bucket = createdDay;
  } else if (lead.updated_at) {
    const updatedDay = toVnDate(lead.updated_at);
    if (dateMap.has(updatedDay)) bucket = updatedDay;
  }

  if (!bucket) return;
  dateMap.get(bucket)!.registeredLeads += 1;
  registeredIds.add(lead.id);
}

function bumpAppointment(
  dateMap: Map<string, LeadStatisticsChartRow>,
  lead: LeadStatLeadRow,
): void {
  if (!lead.appointment_date) return;
  const day = toVnDate(lead.appointment_date);
  const row = dateMap.get(day);
  if (!row) return;

  row.totalAppointments += 1;
  if (lead.attendance_status === AttendanceStatus.ARRIVED) {
    row.arrivedAppointments += 1;
  }
}
