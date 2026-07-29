import { NextRequest, NextResponse } from 'next/server';
import { saveSubscription, type BrowserSubscription } from '@/lib/services/push.service';
import { getCurrentUser } from '@/lib/services/auth.service';
import { HttpStatusCode, PushErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

/** Stores the caller's browser push subscription. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();
    const sub = (body as { subscription?: BrowserSubscription }).subscription;

    if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
      return NextResponse.json(
        { error: PushErrorCode.BAD_REQUEST },
        { status: HttpStatusCode.BAD_REQUEST }
      );
    }

    const userAgent = request.headers.get('user-agent') ?? undefined;
    await saveSubscription(currentUser.id, sub, userAgent);

    return NextResponse.json({ success: true }, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, PushErrorCode.INTERNAL_SERVER_ERROR);
  }
}
