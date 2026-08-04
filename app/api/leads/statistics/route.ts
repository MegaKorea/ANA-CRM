import { NextRequest, NextResponse } from 'next/server';
import { HttpStatusCode, LeadErrorCode, LeadStatus } from '@/constants/enums';
import {
  parseReportsDateRange,
  requireReportsAccess,
} from '@/lib/api/reports-access';
import { aggregateLeadStatistics } from '@/lib/lead-statistics/aggregate-daily';
import type { LeadStatLeadRow } from '@/lib/lead-statistics/types';
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
      .or(
        [
          `and(created_at.gte.${rangeStart},created_at.lte.${rangeEnd})`,
          `and(appointment_date.gte.${rangeStart},appointment_date.lte.${rangeEnd})`,
          `and(status.eq.${LeadStatus.CONVERTED},updated_at.gte.${rangeStart},updated_at.lte.${rangeEnd})`,
        ].join(','),
      );

    if (error) throw error;

    const body = aggregateLeadStatistics(
      startDate,
      endDate,
      (leads ?? []) as LeadStatLeadRow[],
    );

    return NextResponse.json(body, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, LeadErrorCode.INTERNAL_SERVER_ERROR);
  }
}
