import { NextRequest, NextResponse } from 'next/server';
import {
  fetchAppointmentsInRange,
  fetchUpcomingAppointments,
} from '@/lib/services/appointment.service';
import {
  parseReportsDateRange,
  requireReportsAccess,
} from '@/lib/api/reports-access';
import { AppointmentErrorCode, HttpStatusCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireReportsAccess();

    const hasRange =
      Boolean(request.nextUrl.searchParams.get('startDate')?.trim()) ||
      Boolean(request.nextUrl.searchParams.get('endDate')?.trim());

    if (hasRange) {
      const { startDate, endDate } = parseReportsDateRange(request.nextUrl);
      const appointments = await fetchAppointmentsInRange(startDate, endDate);
      return NextResponse.json(appointments, { status: HttpStatusCode.OK });
    }

    const appointments = await fetchUpcomingAppointments();
    return NextResponse.json(appointments, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, AppointmentErrorCode.INTERNAL_SERVER_ERROR);
  }
}
