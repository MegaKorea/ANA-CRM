import { NextRequest, NextResponse } from 'next/server';
import { updateAppointmentById, deleteAppointmentById } from '@/lib/services/appointment.service';
import {
  validateAppointmentId,
  validateUpdateAppointmentInput,
} from '@/lib/validators/appointment.validator';
import { AppointmentErrorCode, HttpStatusCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const appointmentId = validateAppointmentId(id);
    const body = await request.json();
    const input = validateUpdateAppointmentInput(body);
    const appointment = await updateAppointmentById(appointmentId, input);
    return NextResponse.json(appointment, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, AppointmentErrorCode.INTERNAL_SERVER_ERROR);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const appointmentId = validateAppointmentId(id);
    await deleteAppointmentById(appointmentId);
    return NextResponse.json(null, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, AppointmentErrorCode.INTERNAL_SERVER_ERROR);
  }
}
