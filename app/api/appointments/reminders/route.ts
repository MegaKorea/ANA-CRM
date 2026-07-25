import { NextRequest, NextResponse } from 'next/server';
import { fetchDueReminders, markRemindersSent } from '@/lib/services/appointment.service';
import { getCurrentUser } from '@/lib/services/auth.service';
import { AppointmentErrorCode, HttpStatusCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

/** Roles that oversee every lead rather than only the ones assigned to them. */
const MANAGER_ROLE_CODES = ['ADMIN'];

/**
 * Reminder feed polled by the CRM shell.
 *
 * Telesales only see appointments on leads assigned to them, so a reminder is
 * delivered to exactly one person and the single `reminder_sent_at` flag cannot
 * race between staff. Managers see every due reminder, including leads that have
 * no telesales assigned yet.
 *
 * The same service functions are reused verbatim by a future cron/Edge Function
 * once the app is deployed — no rework needed on the client side.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const currentUser = await getCurrentUser();
    const canSeeAllLeads = MANAGER_ROLE_CODES.includes(currentUser.roleCode ?? '');
    const reminders = await fetchDueReminders(currentUser.id, canSeeAllLeads);
    return NextResponse.json(reminders, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, AppointmentErrorCode.INTERNAL_SERVER_ERROR);
  }
}

/** Marks the given reminders as delivered so they stop reappearing. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await getCurrentUser();

    const body = await request.json();
    const rawIds = (body as { ids?: unknown }).ids;

    if (!Array.isArray(rawIds)) {
      return NextResponse.json(
        { error: AppointmentErrorCode.BAD_REQUEST },
        { status: HttpStatusCode.BAD_REQUEST }
      );
    }

    const ids = rawIds
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);

    await markRemindersSent(ids);

    return NextResponse.json({ success: true, count: ids.length }, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, AppointmentErrorCode.INTERNAL_SERVER_ERROR);
  }
}
