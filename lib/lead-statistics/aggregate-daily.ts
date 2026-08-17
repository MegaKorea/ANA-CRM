import { AttendanceStatus, LeadStatus } from '@/constants/enums';
import {
  eachDateInclusive,
  toVnDate,
} from '@/lib/utils/vn-date';
import {
  emptyDayStats,
  type ImportedEnrollmentRow,
  type LeadStatLeadRow,
  type LeadStatisticsApiResponse,
  type LeadStatisticsChartRow,
} from '@/lib/lead-statistics/types';

export function aggregateLeadStatistics(
  startDate: string,
  endDate: string,
  leads: LeadStatLeadRow[],
  importedEnrollments: ImportedEnrollmentRow[] = [],
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

  bumpImportedRegistrations(dateMap, registeredIds, importedEnrollments);

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
  if (!row) return;
  row.totalLeads += 1;
  if (lead.status === LeadStatus.NURTURING) row.nurturingLeads += 1;
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

/**
 * Imported leads' created_at is just the import timestamp, not a real date, so
 * they're excluded from the main leads query. Their conversion is still real
 * though — count it on the lead's earliest enrollment_date instead.
 */
function bumpImportedRegistrations(
  dateMap: Map<string, LeadStatisticsChartRow>,
  registeredIds: Set<number>,
  rows: ImportedEnrollmentRow[],
): void {
  const earliestByLead = new Map<number, string>();
  for (const row of rows) {
    if (!row.enrollment_date) continue;
    const existing = earliestByLead.get(row.lead_id);
    if (!existing || row.enrollment_date < existing) {
      earliestByLead.set(row.lead_id, row.enrollment_date);
    }
  }

  for (const [leadId, enrollmentDate] of earliestByLead) {
    if (registeredIds.has(leadId)) continue;
    const day = toVnDate(enrollmentDate);
    const bucket = dateMap.get(day);
    if (!bucket) continue;
    bucket.registeredLeads += 1;
    registeredIds.add(leadId);
  }
}
