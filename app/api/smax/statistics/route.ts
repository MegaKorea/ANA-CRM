import { NextRequest, NextResponse } from 'next/server';
import { HttpStatusCode, LeadErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';
import { fetchSmaxCustomerStatistics } from '@/lib/smax/smax.service';
import { getCurrentUser } from '@/lib/services/auth.service';
import { AppError } from '@/errors';
import { SmaxCustomerStatType } from '@/constants/smax';
import type { SmaxStatisticsApiResponse } from '@/lib/smax/types';

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await getCurrentUser();

    const { searchParams } = request.nextUrl;
    const startDate = searchParams.get('startDate')?.trim();
    const endDate = searchParams.get('endDate')?.trim();

    if (!startDate || !endDate) {
      throw new AppError(
        LeadErrorCode.BAD_REQUEST,
        HttpStatusCode.BAD_REQUEST,
        'Thiếu startDate hoặc endDate',
      );
    }

    if (!ISO_DATE_RE.test(startDate) || !ISO_DATE_RE.test(endDate)) {
      throw new AppError(
        LeadErrorCode.BAD_REQUEST,
        HttpStatusCode.BAD_REQUEST,
        'Ngày phải dạng YYYY-MM-DD',
      );
    }

    // page_pids always come from server allowlist (SMAX_PAGE_PIDS), never from the client.
    const stats = await fetchSmaxCustomerStatistics({
      startDate,
      endDate,
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
