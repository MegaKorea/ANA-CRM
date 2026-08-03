import { NextRequest, NextResponse } from 'next/server';
import { fetchDueReminders, markRemindersSent } from '@/lib/services/appointment.service';
import { getCurrentUser } from '@/lib/services/auth.service';
import { AppointmentErrorCode, HttpStatusCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

const MANAGER_ROLE_CODES = ['ADMIN'];

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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const currentUser = await getCurrentUser();
    const canSeeAllLeads = MANAGER_ROLE_CODES.includes(currentUser.roleCode ?? '');

    const body = await request.json();
    const rawIds = (body as { ids?: unknown }).ids;

    if (!Array.isArray(rawIds)) {
      return NextResponse.json(
        { error: AppointmentErrorCode.BAD_REQUEST },
        { status: HttpStatusCode.BAD_REQUEST }
      );
    }

    const requestedIds = rawIds
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);

    const due = await fetchDueReminders(currentUser.id, canSeeAllLeads);
    const allowedIds = new Set(due.map((reminder) => reminder.id));
    const ids = requestedIds.filter((id) => allowedIds.has(id));

    await markRemindersSent(ids);

    return NextResponse.json({ success: true, count: ids.length }, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, AppointmentErrorCode.INTERNAL_SERVER_ERROR);
  }
}
