import { NextRequest, NextResponse } from 'next/server';
import { fetchAllLeads, createLead } from '@/lib/services/lead.service';
import { validateCreateLeadInput } from '@/lib/validators/lead.validator';
import { HttpStatusCode, LeadErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? undefined;
    const status = searchParams.get('status') ?? undefined;
    const telesalesId = searchParams.get('telesales_id') ?? undefined;
    const source = searchParams.get('source') ?? undefined;
    const courseId = searchParams.get('course_id') ?? undefined;
    const startDate = searchParams.get('startDate') ?? undefined;
    const endDate = searchParams.get('endDate') ?? undefined;

    const pageStr = searchParams.get('page');
    const limitStr = searchParams.get('limit');

    const page = pageStr ? parseInt(pageStr, 10) : undefined;
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;

    const leads = await fetchAllLeads({
      search: search || undefined,
      status: status as never,
      telesales_id: telesalesId || undefined,
      source: source || undefined,
      course_id: courseId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page,
      limit,
    });
    return NextResponse.json(leads, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, LeadErrorCode.INTERNAL_SERVER_ERROR);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const input = validateCreateLeadInput(body);
    const lead = await createLead(input);
    return NextResponse.json(lead, { status: HttpStatusCode.CREATED });
  } catch (error) {
    return handleRouteError(error, LeadErrorCode.INTERNAL_SERVER_ERROR);
  }
}
