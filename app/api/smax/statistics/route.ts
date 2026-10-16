import { NextRequest, NextResponse } from 'next/server';
import { HttpStatusCode, LeadErrorCode } from '@/constants/enums';
import { SmaxCustomerStatType } from '@/constants/smax';
import {
  parseReportsDateRange,
  requireReportsAccess,
} from '@/lib/api/reports-access';
import { handleRouteError } from '@/lib/utils/route-handler';
import {
  fetchSmaxCustomerStatistics,
  getSmaxFacebookPagePids,
} from '@/lib/smax/smax.service';
import type { SmaxStatisticsApiResponse } from '@/lib/smax/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireReportsAccess();
    const { startDate, endDate } = parseReportsDateRange(request.nextUrl);

    const stats = await fetchSmaxCustomerStatistics({
      startDate,
      endDate,
      // "Nhắn tin" on the reports funnel counts the Facebook channel only.
      pagePids: getSmaxFacebookPagePids(),
      type: SmaxCustomerStatType.MESSAGE_AND_COMMENT,
    });

    const body: SmaxStatisticsApiResponse = {
      messages: stats.messages,
      data: stats.data,
      orders: stats.orders,
      calendars: stats.calendars,
      source: 'smax',
    };

    return NextResponse.json(body, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, LeadErrorCode.INTERNAL_SERVER_ERROR);
  }
}
