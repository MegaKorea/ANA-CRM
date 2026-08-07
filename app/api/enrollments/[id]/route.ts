import { NextRequest, NextResponse } from 'next/server';
import {
  fetchEnrollmentById,
  updateEnrollmentById,
  deleteEnrollmentById,
} from '@/lib/services/enrollment.service';
import { validateUpdateEnrollmentInput, validateEnrollmentId } from '@/lib/validators/enrollment.validator';
import { HttpStatusCode, EnrollmentErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const enrollmentId = validateEnrollmentId(id);
    const enrollment = await fetchEnrollmentById(enrollmentId);
    return NextResponse.json(enrollment, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, EnrollmentErrorCode.INTERNAL_SERVER_ERROR);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const enrollmentId = validateEnrollmentId(id);
    const body = await request.json();
    const input = validateUpdateEnrollmentInput(body);
    const enrollment = await updateEnrollmentById(enrollmentId, input);
    return NextResponse.json(enrollment, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, EnrollmentErrorCode.INTERNAL_SERVER_ERROR);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const enrollmentId = validateEnrollmentId(id);
    await deleteEnrollmentById(enrollmentId);
    return NextResponse.json(null, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, EnrollmentErrorCode.INTERNAL_SERVER_ERROR);
  }
}
