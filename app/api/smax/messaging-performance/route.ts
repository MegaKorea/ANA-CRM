import { NextRequest, NextResponse } from 'next/server';
import { HttpStatusCode, LeadErrorCode } from '@/constants/enums';
import {
  parseReportsDateRange,
  requireReportsAccess,
} from '@/lib/api/reports-access';
import { handleRouteError } from '@/lib/utils/route-handler';
import { fetchSmaxMessagingPerformance } from '@/lib/smax/smax.service';
import type { SmaxMessagingPerformanceApiResponse } from '@/lib/smax/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireReportsAccess();
    const { startDate, endDate } = parseReportsDateRange(request.nextUrl);

    const stats = await fetchSmaxMessagingPerformance({ startDate, endDate });

    const body: SmaxMessagingPerformanceApiResponse = { ...stats, source: 'smax' };

    return NextResponse.json(body, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, LeadErrorCode.INTERNAL_SERVER_ERROR);
  }
}
