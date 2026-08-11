import { NextRequest, NextResponse } from 'next/server';
import { HttpStatusCode, LeadErrorCode } from '@/constants/enums';
import { SmaxCustomerStatType } from '@/constants/smax';
import {
  parseReportsDateRange,
  requireReportsAccess,
} from '@/lib/api/reports-access';
import { handleRouteError } from '@/lib/utils/route-handler';
import { fetchSmaxTagStatistics } from '@/lib/smax/smax.service';
import type { SmaxTagStatisticsApiResponse } from '@/lib/smax/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireReportsAccess();
    const { startDate, endDate } = parseReportsDateRange(request.nextUrl);

    const stats = await fetchSmaxTagStatistics({
      startDate,
      endDate,
      type: SmaxCustomerStatType.MESSAGE_AND_COMMENT,
    });

    const body: SmaxTagStatisticsApiResponse = {
      tags: stats.tags,
      totalNet: stats.totalNet,
      source: 'smax',
    };

    return NextResponse.json(body, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, LeadErrorCode.INTERNAL_SERVER_ERROR);
  }
}
