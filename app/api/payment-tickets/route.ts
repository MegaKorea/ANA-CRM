import { NextRequest, NextResponse } from 'next/server';
import { fetchPaymentTickets, createPaymentTicket } from '@/lib/services/payment-ticket.service';
import { validateCreatePaymentTicketInput } from '@/lib/validators/payment-ticket.validator';
import { HttpStatusCode, PaymentTicketErrorCode, TicketStatus } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const leadIdStr = searchParams.get('lead_id');
    const status = searchParams.get('status') ?? undefined;
    const date = searchParams.get('date') ?? undefined;
    const startDate = searchParams.get('startDate') ?? undefined;
    const endDate = searchParams.get('endDate') ?? undefined;
    const pageStr = searchParams.get('page');
    const limitStr = searchParams.get('limit');

    const lead_id = leadIdStr ? parseInt(leadIdStr, 10) : undefined;
    const page = pageStr ? parseInt(pageStr, 10) : undefined;
    const limit = limitStr ? parseInt(limitStr, 10) : undefined;

    const result = await fetchPaymentTickets({
      lead_id: lead_id || undefined,
      status: (status as TicketStatus) || undefined,
      date: date || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      page,
      limit,
    });

    return NextResponse.json(result, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, PaymentTicketErrorCode.INTERNAL_SERVER_ERROR);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const input = validateCreatePaymentTicketInput(body);
    const ticket = await createPaymentTicket(input);
    return NextResponse.json(ticket, { status: HttpStatusCode.CREATED });
  } catch (error) {
    return handleRouteError(error, PaymentTicketErrorCode.INTERNAL_SERVER_ERROR);
  }
}
