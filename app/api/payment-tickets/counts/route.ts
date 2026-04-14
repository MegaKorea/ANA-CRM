import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { HttpStatusCode } from '@/constants/enums';

/**
 * GET /api/payment-tickets/counts?lead_ids=1,2,3
 * Returns the number of payment tickets (pending + approved) per lead_id.
 * Rejected tickets are excluded so the badge reflects meaningful submissions.
 * Response: { [leadId: string]: number }
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const leadIdsParam = searchParams.get('lead_ids');

    if (!leadIdsParam) {
      return NextResponse.json({}, { status: HttpStatusCode.OK });
    }

    const leadIds = leadIdsParam
      .split(',')
      .map((id) => parseInt(id.trim(), 10))
      .filter((id) => !isNaN(id));

    if (leadIds.length === 0) {
      return NextResponse.json({}, { status: HttpStatusCode.OK });
    }

    const supabase = createAdminClient();

    // Count pending + approved tickets (exclude rejected)
    const { data, error } = await supabase
      .from('payment_tickets')
      .select('lead_id, status')
      .in('lead_id', leadIds)
      .in('status', ['pending', 'approved']);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Count per lead_id
    const counts: Record<string, number> = {};
    // Initialize all requested leads to 0
    for (const id of leadIds) {
      counts[String(id)] = 0;
    }
    for (const row of data as { lead_id: number }[]) {
      const key = String(row.lead_id);
      counts[key] = (counts[key] ?? 0) + 1;
    }

    return NextResponse.json(counts, { status: HttpStatusCode.OK });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
