import { NextRequest, NextResponse } from 'next/server';
import { fetchLeadById, updateLeadById, deleteLeadById } from '@/lib/services/lead.service';
import { validateUpdateLeadInput, validateLeadId } from '@/lib/validators/lead.validator';
import { HttpStatusCode, LeadErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const leadId = validateLeadId(id);
    const lead = await fetchLeadById(leadId);
    return NextResponse.json(lead, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, LeadErrorCode.INTERNAL_SERVER_ERROR);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const leadId = validateLeadId(id);
    const body = await request.json();
    const input = validateUpdateLeadInput(body);
    const lead = await updateLeadById(leadId, input);
    return NextResponse.json(lead, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, LeadErrorCode.INTERNAL_SERVER_ERROR);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const leadId = validateLeadId(id);
    await deleteLeadById(leadId);
    return NextResponse.json(null, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, LeadErrorCode.INTERNAL_SERVER_ERROR);
  }
}
