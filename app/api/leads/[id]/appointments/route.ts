import { NextRequest, NextResponse } from 'next/server';
import { fetchAppointmentsByLeadId, createAppointment } from '@/lib/services/appointment.service';
import { validateCreateAppointmentInput } from '@/lib/validators/appointment.validator';
import { validateLeadId } from '@/lib/validators/lead.validator';
import { AppointmentErrorCode, HttpStatusCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';
    
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
