import { NextRequest, NextResponse } from 'next/server';
import { HttpStatusCode, UserNotificationErrorCode } from '@/constants/enums';
import { sessionContentErrorResponse } from '@/lib/api/session-content-route';
import { getCurrentUser } from '@/lib/services/auth.service';
import { markNotificationRead } from '@/lib/services/user-notification.service';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    const { id } = await params;
    const item = await markNotificationRead(user.id, id);
    return NextResponse.json(item, { status: HttpStatusCode.OK });
  } catch (error: unknown) {
    return sessionContentErrorResponse(error, UserNotificationErrorCode.INTERNAL);
  }
}
