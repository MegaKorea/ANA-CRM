import { NextRequest, NextResponse } from 'next/server';
import { getLeadPaymentSummary } from '@/lib/services/payment-ticket.service';
import { validatePaymentTicketId } from '@/lib/validators/payment-ticket.validator';
import { HttpStatusCode, PaymentTicketErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
): Promise<NextResponse> {
  try {
    const { leadId } = await params;
    const id = validatePaymentTicketId(leadId);
    const summary = await getLeadPaymentSummary(id);
    return NextResponse.json(summary, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, PaymentTicketErrorCode.INTERNAL_SERVER_ERROR);
  }
}
