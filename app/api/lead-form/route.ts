import { NextRequest, NextResponse } from 'next/server';
import {
  createLead,
  fetchLeadById,
  findDuplicateLead,
  updateLeadById,
} from '@/lib/services/lead.service';
import {
  validateLeadFormInput,
  validateLeadId,
  type LeadFormInput,
} from '@/lib/validators/lead.validator';
import type { NoteItem } from '@/lib/supabase/types/tables/leads';
import { HttpStatusCode, LeadErrorCode, LeadSource, LeadStatus } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';
import { normalizePhoneDigits } from '@/lib/utils/phone';
import { fail } from '@/errors';

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function leadMatchesSubmittedIdentity(
  existing: { full_name: string; phone_number: string | null },
  input: { full_name: string; phone_number: string },
): boolean {
  // Public endpoint, so lead_id must be one findDuplicateLead would itself have surfaced:
  // same phone, or same name. Requiring the phone to match made the name-only duplicate
  // flow impossible — "Cập nhật" always 403'd and the typed note was lost.
  const existingPhone = normalizePhoneDigits(existing.phone_number);
  if (existingPhone && existingPhone === normalizePhoneDigits(input.phone_number)) {
    return true;
  }
  return sameName(existing.full_name, input.full_name);
}

function toDuplicatePayload(lead: {
  id: number;
  full_name: string;
  phone_number: string | null;
  status: string | null;
  source: string | null;
  created_at: string | null;
}) {
  return {
    id: lead.id,
    full_name: lead.full_name,
    phone_number: lead.phone_number,
    status: lead.status,
    source: lead.source,
    created_at: lead.created_at,
  };
}

async function applyLeadUpdate(
  leadId: number,
  existing: { note: NoteItem[] | null },
  input: LeadFormInput,
): Promise<NextResponse> {
  const mergedNote = input.note
    ? [...(Array.isArray(existing.note) ? existing.note : []), ...input.note]
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const input = validateLeadFormInput(body);

    const rawLeadId = (body as { lead_id?: unknown }).lead_id;

    if (rawLeadId !== undefined && rawLeadId !== null) {
      const leadId = validateLeadId(rawLeadId);

      const existing = await fetchLeadById(leadId);
      if (!leadMatchesSubmittedIdentity(existing, input)) {
        fail(
          LeadErrorCode.BAD_REQUEST,
          HttpStatusCode.FORBIDDEN,
          'Lead không khớp thông tin đã gửi.',
        );
      }

      return applyLeadUpdate(leadId, existing, input);
    }

    const duplicate = await findDuplicateLead(input.full_name, input.phone_number);
    if (duplicate) {
      // Same phone number = same person, so update straight away. Returning 409 here made
      // the client bounce the submit back as a second "Cập nhật" click, which silently
      // dropped the note the user had just typed. Only a name-only match still needs
      // confirming, since that would overwrite a different person's phone number.
      if (normalizePhoneDigits(duplicate.phone_number) === normalizePhoneDigits(input.phone_number)) {
        return applyLeadUpdate(duplicate.id, duplicate, input);
      }

      return NextResponse.json(
        { success: false, code: 'DUPLICATE_LEAD', existing: toDuplicatePayload(duplicate) },
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

// Lets the form warn about an existing lead while the user is still typing, instead of
// only after they submit and get bounced back for a second click.
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const input = validateLeadFormInput({
      full_name: searchParams.get('full_name'),
      phone_number: searchParams.get('phone_number'),
    });

    const duplicate = await findDuplicateLead(input.full_name, input.phone_number);

    return NextResponse.json(
      { existing: duplicate ? toDuplicatePayload(duplicate) : null },
      { status: HttpStatusCode.OK }
    );
  } catch (error) {
    return handleRouteError(error, LeadErrorCode.INTERNAL_SERVER_ERROR);
  }
}
