import { NextRequest, NextResponse } from 'next/server';
import { ensureEnrollmentForLead } from '@/lib/services/enrollment.service';
import { validateCreateEnrollmentInput } from '@/lib/validators/enrollment.validator';
import { HttpStatusCode, EnrollmentErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const input = validateCreateEnrollmentInput(body);
    const enrollment = await ensureEnrollmentForLead(input);
    return NextResponse.json(enrollment, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, EnrollmentErrorCode.INTERNAL_SERVER_ERROR);
  }
}
