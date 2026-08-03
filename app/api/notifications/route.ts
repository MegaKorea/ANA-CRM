import { NextRequest, NextResponse } from 'next/server';
import { HttpStatusCode, UserNotificationErrorCode } from '@/constants/enums';
import { sessionContentErrorResponse } from '@/lib/api/session-content-route';
import { getCurrentUser } from '@/lib/services/auth.service';
import {
  countMyUnreadNotifications,
  listMyNotifications,
  markAllNotificationsRead,
} from '@/lib/services/user-notification.service';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    const unreadOnly = request.nextUrl.searchParams.get('unread') === '1';
    const [items, unreadCount] = await Promise.all([
      listMyNotifications(user.id, { unreadOnly }),
      countMyUnreadNotifications(user.id),
    ]);
    return NextResponse.json({ items, unreadCount }, { status: HttpStatusCode.OK });
  } catch (error: unknown) {
    return sessionContentErrorResponse(error, UserNotificationErrorCode.INTERNAL);
  }
}

export async function PATCH(): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    const updated = await markAllNotificationsRead(user.id);
    return NextResponse.json({ updated }, { status: HttpStatusCode.OK });
  } catch (error: unknown) {
    return sessionContentErrorResponse(error, UserNotificationErrorCode.INTERNAL);
  }
}
