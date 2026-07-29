import { NextRequest, NextResponse } from 'next/server';
import {
  createLead,
  fetchLeadById,
  findDuplicateLead,
  updateLeadById,
} from '@/lib/services/lead.service';
import { validateLeadFormInput, validateLeadId } from '@/lib/validators/lead.validator';
import { HttpStatusCode, LeadErrorCode, LeadSource, LeadStatus } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

/**
 * Staff lead-form endpoint (no session — served inside the embedded Smax form,
 * so it is registered in PUBLIC_ROUTES). Operated by staff, not customers.
 *
 * Accepts { full_name, phone_number, date_of_birth, status, note, smax_log,
 * lead_id? }. Everything else (telesales_id, source, ...) is still forced
 * server-side so this unauthenticated surface cannot set privileged fields.
 * `status` is limited to the LeadStatus whitelist by the validator.
 *
 * Flow:
 *  - With `lead_id`: the staff confirmed an update, so the matching lead is
 *    updated and the note is APPENDED to its existing note history.
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

      // `note` is a history array — replacing it would wipe every earlier note,
      // so read the current value and append instead.
      const existing = await fetchLeadById(leadId);
      const mergedNote = input.note
        ? [...(existing.note ?? []), ...input.note]
        : undefined;

      const lead = await updateLeadById(leadId, {
        full_name: input.full_name,
        phone_number: input.phone_number,
        smax_log: input.smax_log,
        source: LeadSource.FACEBOOK,
        ...(input.date_of_birth ? { date_of_birth: input.date_of_birth } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(mergedNote ? { note: mergedNote } : {}),
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
      source: LeadSource.FACEBOOK,
      status: input.status ?? LeadStatus.NEW,
      date_of_birth: input.date_of_birth,
      note: input.note,
    });

    return NextResponse.json({ success: true, id: lead.id }, { status: HttpStatusCode.CREATED });
  } catch (error) {
    return handleRouteError(error, LeadErrorCode.INTERNAL_SERVER_ERROR);
  }
}
