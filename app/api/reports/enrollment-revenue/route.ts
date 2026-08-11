import { NextRequest, NextResponse } from 'next/server';
import { HttpStatusCode, LeadErrorCode } from '@/constants/enums';
import { parseReportsDateRange, requireReportsAccess } from '@/lib/api/reports-access';
import { getEnrollmentRevenueSummary } from '@/lib/services/enrollment.service';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireReportsAccess();
    const { startDate, endDate } = parseReportsDateRange(request.nextUrl);
    const summary = await getEnrollmentRevenueSummary(startDate, endDate);

    return NextResponse.json(summary, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, LeadErrorCode.INTERNAL_SERVER_ERROR);
  }
}
