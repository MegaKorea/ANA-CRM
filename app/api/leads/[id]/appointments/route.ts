import { NextRequest, NextResponse } from 'next/server';
import { fetchAppointmentsByLeadId, createAppointment } from '@/lib/services/appointment.service';
import { validateCreateAppointmentInput } from '@/lib/validators/appointment.validator';
import { validateLeadId } from '@/lib/validators/lead.validator';
import { AppointmentErrorCode, HttpStatusCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

/** Lists every appointment booked for a lead, newest first. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const leadId = validateLeadId(id);
    const appointments = await fetchAppointmentsByLeadId(leadId);
    return NextResponse.json(appointments, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, AppointmentErrorCode.INTERNAL_SERVER_ERROR);
  }
}

/** Books a new appointment for the lead (a lead may hold many). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const leadId = validateLeadId(id);
    const body = await request.json();
    const input = validateCreateAppointmentInput({ ...body, lead_id: leadId });
    const appointment = await createAppointment(input);
    return NextResponse.json(appointment, { status: HttpStatusCode.CREATED });
  } catch (error) {
    return handleRouteError(error, AppointmentErrorCode.INTERNAL_SERVER_ERROR);
  }
}
