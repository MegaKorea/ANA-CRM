import { NextRequest, NextResponse } from 'next/server';
import { fetchAllEnrollments, createEnrollment } from '@/lib/services/enrollment.service';
import { validateCreateEnrollmentInput } from '@/lib/validators/enrollment.validator';
import { EnrollmentStatus, HttpStatusCode, EnrollmentErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('lead_id');
    const courseId = searchParams.get('course_id') ?? undefined;
    const classId = searchParams.get('class_id') ?? undefined;
    const status = searchParams.get('status') ?? undefined;
    const salesMonth = searchParams.get('sales_month') ?? undefined;

    const pageStr = searchParams.get('page');
    const limitStr = searchParams.get('limit');

    const page = pageStr ? parseInt(pageStr, 10) : undefined;
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;

    const enrollments = await fetchAllEnrollments({
      lead_id: leadId ? Number(leadId) : undefined,
      course_id: courseId,
      class_id: classId,
      status: status as EnrollmentStatus | undefined,
      sales_month: salesMonth,
      page,
      limit,
    });
    return NextResponse.json(enrollments, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, EnrollmentErrorCode.INTERNAL_SERVER_ERROR);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const input = validateCreateEnrollmentInput(body);
    const enrollment = await createEnrollment(input);
    return NextResponse.json(enrollment, { status: HttpStatusCode.CREATED });
  } catch (error) {
    return handleRouteError(error, EnrollmentErrorCode.INTERNAL_SERVER_ERROR);
  }
}
