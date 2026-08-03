import { NextResponse } from 'next/server';
import { sendPushToUser } from '@/lib/services/push.service';
import { getCurrentUser } from '@/lib/services/auth.service';
import { HttpStatusCode, PushErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';


export async function POST(): Promise<NextResponse> {
  try {
    const currentUser = await getCurrentUser();
    const delivered = await sendPushToUser(currentUser.id, {
      title: 'Thông báo thử',
      body: 'Web push đã hoạt động 🎉 Bạn sẽ nhận nhắc lịch hẹn qua thông báo này.',
      url: '/lead',
      tag: 'push-test',
    });

    return NextResponse.json({ success: true, delivered }, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, PushErrorCode.INTERNAL_SERVER_ERROR);
  }
}
