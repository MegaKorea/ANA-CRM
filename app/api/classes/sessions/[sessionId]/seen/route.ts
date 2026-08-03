import { NextRequest, NextResponse } from 'next/server';
import { fail } from '@/errors';
import { HttpStatusCode, NotificationPayloadKind, UserNotificationErrorCode } from '@/constants/enums';
import { sessionContentErrorResponse } from '@/lib/api/session-content-route';
import { getCurrentUser } from '@/lib/services/auth.service';
import { markSessionNotificationsRead } from '@/lib/services/user-notification.service';

/** Clears the "mới" schedule badge: marks this user's lecture/quiz notifications for the session as read. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
): Promise<NextResponse> {
  try {
    const { sessionId } = await params;
    const body = await request.json().catch(() => null);
    const kind = (body as { kind?: unknown } | null)?.kind;
    if (kind !== NotificationPayloadKind.LECTURE && kind !== NotificationPayloadKind.QUIZ) {
      fail(UserNotificationErrorCode.INVALID_INPUT, HttpStatusCode.BAD_REQUEST);
    }

    const user = await getCurrentUser();
    const updated = await markSessionNotificationsRead(user.id, sessionId, kind);
    return NextResponse.json({ updated }, { status: HttpStatusCode.OK });
  } catch (error: unknown) {
    return sessionContentErrorResponse(error, UserNotificationErrorCode.INTERNAL);
  }
}
