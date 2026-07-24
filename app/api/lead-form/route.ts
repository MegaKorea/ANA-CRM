import { NextRequest, NextResponse } from 'next/server';
import { createLead, findDuplicateLead, updateLeadById } from '@/lib/services/lead.service';
import { validateLeadFormInput, validateLeadId } from '@/lib/validators/lead.validator';
import { HttpStatusCode, LeadErrorCode, LeadSource, LeadStatus } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

/**
 * Staff lead-form endpoint (no session — served inside the embedded Smax form,
 * so it is registered in PUBLIC_ROUTES). Operated by staff, not customers.
 *
 * Accepts only { full_name, phone_number, smax_log, lead_id? } — every other
 * lead field is forced server-side so the unauthenticated surface cannot be used
 * to set privileged fields (status, telesales_id, ...).
 *
 * Flow:
 *  - With `lead_id`: the staff confirmed an update, so the matching lead's name,
 *    phone and smax_log are updated.
 *  - Without `lead_id`: if a lead with the same phone or name already exists,
 *    responds 409 with the existing lead so the client can offer update/cancel;
 *    otherwise a new lead is created.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const input = validateLeadFormInput(body);

    const rawLeadId = (body as { lead_id?: unknown }).lead_id;

    // Staff explicitly chose to update the existing (duplicate) lead.
    if (rawLeadId !== undefined && rawLeadId !== null) {
      const leadId = validateLeadId(rawLeadId);
      const lead = await updateLeadById(leadId, {
        full_name: input.full_name,
        phone_number: input.phone_number,
        smax_log: input.smax_log,
      });

      return NextResponse.json(
        { success: true, id: lead.id, updated: true },
        { status: HttpStatusCode.OK }
      );
    }

    // Detect a lead colliding on phone or name before creating a new one.
    const duplicate = await findDuplicateLead(input.full_name, input.phone_number);
    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          code: 'DUPLICATE_LEAD',
          existing: {
            id: duplicate.id,
            full_name: duplicate.full_name,
            phone_number: duplicate.phone_number,
            status: duplicate.status,
            source: duplicate.source,
            created_at: duplicate.created_at,
          },
        },
        { status: HttpStatusCode.CONFLICT }
      );
    }

    const lead = await createLead({
      full_name: input.full_name,
      phone_number: input.phone_number,
      smax_log: input.smax_log,
      source: LeadSource.SMAX,
      status: LeadStatus.NEW,
    });

    return NextResponse.json({ success: true, id: lead.id }, { status: HttpStatusCode.CREATED });
  } catch (error) {
    return handleRouteError(error, LeadErrorCode.INTERNAL_SERVER_ERROR);
  }
}
