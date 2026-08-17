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
import { fail } from '@/errors';

function normalizePhone(phone: string | null | undefined): string {
  return (phone ?? '').replace(/\D/g, '');
}

function leadMatchesSubmittedIdentity(
  existing: { full_name: string; phone_number: string | null },
  input: { full_name: string; phone_number: string },
): boolean {
  const existingPhone = normalizePhone(existing.phone_number);
  const submittedPhone = normalizePhone(input.phone_number);

  if (existingPhone) {
    return existingPhone === submittedPhone;
  }

  return (
    existing.full_name.trim().toLowerCase() === input.full_name.trim().toLowerCase()
  );
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
      if (normalizePhone(duplicate.phone_number) === normalizePhone(input.phone_number)) {
        return applyLeadUpdate(duplicate.id, duplicate, input);
      }

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
