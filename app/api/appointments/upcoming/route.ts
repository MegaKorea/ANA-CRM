import { NextResponse } from 'next/server';
import { fetchUpcomingAppointments } from '@/lib/services/appointment.service';
import { requireReportsAccess } from '@/lib/api/reports-access';
import { AppointmentErrorCode, HttpStatusCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function GET(): Promise<NextResponse> {
  try {
    await requireReportsAccess();
    const appointments = await fetchUpcomingAppointments();
    return NextResponse.json(appointments, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, AppointmentErrorCode.INTERNAL_SERVER_ERROR);
  }
}
