import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/services/auth.service';
import { HttpStatusCode } from '@/constants/enums';
import { fail } from '@/errors';
import { handleRouteError } from '@/lib/utils/route-handler';

const MAX_LEAD_IDS = 200;

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser.roleCode || currentUser.roleCode === 'STU') {
      fail('FORBIDDEN', HttpStatusCode.FORBIDDEN, 'Không có quyền xem phiếu thu.');
    }

    const { searchParams } = new URL(request.url);
    const leadIdsParam = searchParams.get('lead_ids');

    if (!leadIdsParam) {
      return NextResponse.json({}, { status: HttpStatusCode.OK });
    }

    const leadIds = [
      ...new Set(
        leadIdsParam
          .split(',')
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    ].slice(0, MAX_LEAD_IDS);

    if (leadIds.length === 0) {
      return NextResponse.json({}, { status: HttpStatusCode.OK });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('payment_tickets')
      .select('lead_id, status')
      .in('lead_id', leadIds)
      .in('status', ['pending', 'approved']);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const counts: Record<string, number> = {};
    for (const id of leadIds) {
      counts[String(id)] = 0;
    }
    for (const row of data as { lead_id: number }[]) {
      const key = String(row.lead_id);
      counts[key] = (counts[key] ?? 0) + 1;
    }

    return NextResponse.json(counts, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, 'PAYMENT_TICKET_COUNTS_FAILED');
  }
}
