import { NextRequest, NextResponse } from 'next/server';
import { HttpStatusCode, LeadErrorCode } from '@/constants/enums';
import { requireReportsAccess } from '@/lib/api/reports-access';
import { getTeamSalesReportRows } from '@/lib/services/team-sales-report.service';
import { AppError } from '@/errors';
import { handleRouteError } from '@/lib/utils/route-handler';

function parseIsoDateTime(value: string | null, field: string): string {
  if (!value || Number.isNaN(new Date(value).getTime())) {
    throw new AppError(
      LeadErrorCode.BAD_REQUEST,
      HttpStatusCode.BAD_REQUEST,
      `${field} phải là ngày giờ hợp lệ`,
    );
  }
  return value;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireReportsAccess();

    const startAt = parseIsoDateTime(request.nextUrl.searchParams.get('startAt'), 'startAt');
    const endAt = parseIsoDateTime(request.nextUrl.searchParams.get('endAt'), 'endAt');

    if (startAt >= endAt) {
      throw new AppError(
        LeadErrorCode.BAD_REQUEST,
        HttpStatusCode.BAD_REQUEST,
        'startAt phải nhỏ hơn endAt',
      );
    }

    const rows = await getTeamSalesReportRows(startAt, endAt);
    return NextResponse.json({ rows }, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, LeadErrorCode.INTERNAL_SERVER_ERROR);
  }
}
