import { NextRequest, NextResponse } from 'next/server';
import { updateLeadById } from '@/lib/services/lead.service';
import { validateLeadId } from '@/lib/validators/lead.validator';
import { HttpStatusCode, LeadErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const leadId = validateLeadId(id);

    const body = await request.json();
    const { telesales_id } = body as { telesales_id: string | null };

    if (telesales_id !== null && telesales_id !== undefined) {
      const supabase = createAdminClient();

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, role_id, roles!inner(code)')
        .eq('id', telesales_id)
        .single();

      if (userError || !user) {
        return NextResponse.json(
          { error: 'Người dùng không tồn tại' },
          { status: HttpStatusCode.BAD_REQUEST },
        );
      }

      const roleCode = (user as any)?.roles?.code;
      if (roleCode !== 'TELESALES') {
        return NextResponse.json(
          { error: 'Người dùng không có quyền TELESALES' },
          { status: HttpStatusCode.BAD_REQUEST },
        );
      }
    }

    const lead = await updateLeadById(leadId, {
      telesales_id: telesales_id,
    });

    return NextResponse.json(lead, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, LeadErrorCode.INTERNAL_SERVER_ERROR);
  }
}
