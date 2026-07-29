import { NextRequest, NextResponse } from 'next/server';
import { deleteSubscription } from '@/lib/services/push.service';
import { getCurrentUser } from '@/lib/services/auth.service';
import { HttpStatusCode, PushErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

/** Removes a browser push subscription by endpoint. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await getCurrentUser();
    const body = await request.json();
    const endpoint = (body as { endpoint?: string }).endpoint;

    if (!endpoint) {
      return NextResponse.json(
        { error: PushErrorCode.BAD_REQUEST },
        { status: HttpStatusCode.BAD_REQUEST }
      );
    }

    await deleteSubscription(endpoint);
    return NextResponse.json({ success: true }, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, PushErrorCode.INTERNAL_SERVER_ERROR);
  }
}
