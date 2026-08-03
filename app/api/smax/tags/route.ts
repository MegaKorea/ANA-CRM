import { NextRequest, NextResponse } from 'next/server';
import { HttpStatusCode, LeadErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';
import { fetchSmaxTagStatistics } from '@/lib/smax/smax.service';
import { getCurrentUser } from '@/lib/services/auth.service';
import { AppError } from '@/errors';
import { SmaxCustomerStatType } from '@/constants/smax';
import type { SmaxTagStatisticsApiResponse } from '@/lib/smax/types';
import { isIsoDate } from '@/lib/utils/vn-date';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await getCurrentUser();

    const startDate = request.nextUrl.searchParams.get('startDate')?.trim() ?? '';
    const endDate = request.nextUrl.searchParams.get('endDate')?.trim() ?? '';

    if (!startDate || !endDate) {
      throw new AppError(
        LeadErrorCode.BAD_REQUEST,
        HttpStatusCode.BAD_REQUEST,
        'Thiếu startDate hoặc endDate',
      );
    }

    if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
      throw new AppError(
        LeadErrorCode.BAD_REQUEST,
        HttpStatusCode.BAD_REQUEST,
        'Ngày phải dạng YYYY-MM-DD',
      );
    }

    if (startDate > endDate) {
      throw new AppError(
        LeadErrorCode.BAD_REQUEST,
        HttpStatusCode.BAD_REQUEST,
        'startDate phải nhỏ hơn hoặc bằng endDate',
      );
    }

    const stats = await fetchSmaxTagStatistics({
      startDate,
      endDate,
      type: SmaxCustomerStatType.MESSAGE_AND_COMMENT,
    });

    const body: SmaxTagStatisticsApiResponse = {
      tags: stats.tags,
      source: 'smax',
    };

    return NextResponse.json(body, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, LeadErrorCode.INTERNAL_SERVER_ERROR);
  }
}
