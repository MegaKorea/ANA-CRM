import { NextRequest, NextResponse } from 'next/server';
import { addLeadNote } from '@/lib/services/lead.service';
import { validateAddNoteInput, validateLeadId } from '@/lib/validators/lead.validator';
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
    const content = validateAddNoteInput(body);
    const lead = await addLeadNote(leadId, content);
    return NextResponse.json(lead, { status: HttpStatusCode.CREATED });
  } catch (error) {
    return handleRouteError(error, LeadErrorCode.INTERNAL_SERVER_ERROR);
  }
}
