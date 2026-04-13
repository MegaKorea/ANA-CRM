import { NextRequest, NextResponse } from 'next/server';
import { reviewPaymentTicket } from '@/lib/services/payment-ticket.service';
import {
  validatePaymentTicketId,
  validateReviewPaymentTicketInput,
} from '@/lib/validators/payment-ticket.validator';
import { HttpStatusCode, PaymentTicketErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const ticketId = validatePaymentTicketId(id);
    const body = await request.json();
    const input = validateReviewPaymentTicketInput(body);
    const ticket = await reviewPaymentTicket(ticketId, input);
    return NextResponse.json(ticket, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, PaymentTicketErrorCode.INTERNAL_SERVER_ERROR);
  }
}
