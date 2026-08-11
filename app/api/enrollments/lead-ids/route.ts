import { NextResponse } from 'next/server';
import { fetchEnrolledLeadIds } from '@/lib/services/enrollment.service';
import { HttpStatusCode, EnrollmentErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function GET(): Promise<NextResponse> {
  try {
    const leadIds = await fetchEnrolledLeadIds();
    return NextResponse.json({ data: leadIds }, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, EnrollmentErrorCode.INTERNAL_SERVER_ERROR);
  }
}
