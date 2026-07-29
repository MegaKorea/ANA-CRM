import { NextRequest, NextResponse } from 'next/server';
import { sendDueAppointmentPushes } from '@/lib/services/push.service';
import { HttpStatusCode, PushErrorCode } from '@/constants/enums';
import { EnvKey, getOptionalEnv } from '@/config/env.config';
import { handleRouteError } from '@/lib/utils/route-handler';

/**
 * Fires web-push notifications for all due appointment reminders.
 *
 * Session-less: guarded by a shared secret in the `x-cron-secret` header so a
 * scheduler (the dev instrumentation hook now, Supabase cron once deployed) can
 * call it. Registered in PUBLIC_ROUTES so middleware skips the auth check.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const expected = getOptionalEnv(EnvKey.CRON_SECRET);
    const provided = request.headers.get('x-cron-secret');

    if (!expected || provided !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: HttpStatusCode.UNAUTHORIZED });
    }

    const result = await sendDueAppointmentPushes();
    return NextResponse.json({ success: true, ...result }, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, PushErrorCode.INTERNAL_SERVER_ERROR);
  }
}
