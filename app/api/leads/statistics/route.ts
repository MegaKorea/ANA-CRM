import { NextRequest, NextResponse } from 'next/server';
import { HttpStatusCode, LeadErrorCode, LeadStatus } from '@/constants/enums';
import {
  parseReportsDateRange,
  requireReportsAccess,
} from '@/lib/api/reports-access';
import { aggregateLeadStatistics } from '@/lib/lead-statistics/aggregate-daily';
import type { ImportedEnrollmentRow, LeadStatLeadRow } from '@/lib/lead-statistics/types';
import { createAdminClient } from '@/lib/supabase/admin';
import { handleRouteError } from '@/lib/utils/route-handler';
import {
  quotePostgrestValue,
  vnDayEndIso,
  vnDayStartIso,
} from '@/lib/utils/vn-date';

const LEAD_STAT_SELECT =
  'id, created_at, updated_at, appointment_date, status, attendance_status';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireReportsAccess();
    const { startDate, endDate } = parseReportsDateRange(request.nextUrl);

    const rangeStart = quotePostgrestValue(vnDayStartIso(startDate));
    const rangeEnd = quotePostgrestValue(vnDayEndIso(endDate));

    const supabase = createAdminClient();
    const { data: leads, error } = await supabase
      .from('leads')
      .select(LEAD_STAT_SELECT)
      .eq('is_imported', false)
      .or(
        [
          `and(created_at.gte.${rangeStart},created_at.lte.${rangeEnd})`,
          `and(appointment_date.gte.${rangeStart},appointment_date.lte.${rangeEnd})`,
          `and(status.eq.${LeadStatus.CONVERTED},updated_at.gte.${rangeStart},updated_at.lte.${rangeEnd})`,
        ].join(','),
      );

    if (error) throw error;

    // Imported leads' created_at is just the import timestamp — count their
    // conversion by real enrollment_date instead (see aggregateLeadStatistics).
    const { data: importedLeads, error: importedLeadsError } = await supabase
      .from('leads')
      .select('id')
      .eq('is_imported', true);
    if (importedLeadsError) throw importedLeadsError;

    const importedLeadIds = ((importedLeads ?? []) as { id: number }[]).map((lead) => lead.id);
    let importedEnrollments: ImportedEnrollmentRow[] = [];
    if (importedLeadIds.length > 0) {
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('lead_id, enrollment_date')
        .in('lead_id', importedLeadIds);
      if (enrollmentsError) throw enrollmentsError;
      importedEnrollments = (enrollments ?? []) as ImportedEnrollmentRow[];
    }

    // Current pipeline snapshot, not scoped to startDate/endDate — "nurturing"
    // is an ongoing state, not a dated event, so it shouldn't hide leads just
    // because they were created outside the selected range.
    const { count: nurturingTotal, error: nurturingError } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('is_imported', false)
      .eq('status', LeadStatus.NURTURING);
    if (nurturingError) throw nurturingError;

    const body = aggregateLeadStatistics(
      startDate,
      endDate,
      (leads ?? []) as LeadStatLeadRow[],
      importedEnrollments,
    );
    body.summary.nurturingTotal = nurturingTotal ?? 0;

    return NextResponse.json(body, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, LeadErrorCode.INTERNAL_SERVER_ERROR);
  }
}
