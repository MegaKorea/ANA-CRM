import { NextRequest, NextResponse } from 'next/server';
import { HttpStatusCode, LeadErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';
import { fetchSmaxThreadMessages } from '@/lib/smax/smax.service';
import { getCurrentUser } from '@/lib/services/auth.service';
import { AppError } from '@/errors';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await getCurrentUser();

    const { searchParams } = request.nextUrl;
    const pageId = searchParams.get('pageId')?.trim();
    const facebookId = searchParams.get('facebookId')?.trim();
    const bizAlias = searchParams.get('bizAlias')?.trim() || undefined;

    if (!pageId || !facebookId) {
      throw new AppError(
        LeadErrorCode.BAD_REQUEST,
        HttpStatusCode.BAD_REQUEST,
        'Thiếu pageId hoặc facebookId'
      );
    }

    const data = await fetchSmaxThreadMessages({
      pageId,
      facebookId,
      bizAlias,
    });

    return NextResponse.json(data, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, LeadErrorCode.INTERNAL_SERVER_ERROR);
  }
}
