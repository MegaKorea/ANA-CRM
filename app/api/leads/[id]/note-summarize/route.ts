import { NextRequest, NextResponse } from 'next/server';
import { addLeadNoteSummarize } from '@/lib/services/lead.service';
import { validateNoteSummarizeInput, validateLeadId } from '@/lib/validators/lead.validator';
import { HttpStatusCode, LeadErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const leadId = validateLeadId(id);
    const body = await request.json();
    const { url, mimeType } = validateNoteSummarizeInput(body);
    const lead = await addLeadNoteSummarize(leadId, url, mimeType);
    return NextResponse.json(lead, { status: HttpStatusCode.CREATED });
  } catch (error) {
    return handleRouteError(error, LeadErrorCode.INTERNAL_SERVER_ERROR);
  }
}
