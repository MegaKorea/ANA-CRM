import { createAdminClient } from '@/lib/supabase/admin';
import { handleServiceError, handleSupabaseError, validateDataExists } from '@/lib/utils/error-handler';
import { AppointmentErrorCode, AttendanceStatus } from '@/constants/enums';
import type {
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '@/lib/validators/appointment.validator';
import type { LeadAppointmentsTable } from '@/lib/supabase/types/tables/lead_appointments';
import type { InsertTables, UpdateTables } from '@/types/supabase';

export type LeadAppointment = LeadAppointmentsTable['Row'];

/** An appointment joined with the lead fields the reminder popup needs. */
export type DueAppointment = LeadAppointment & {
  lead_full_name: string | null;
  lead_phone_number: string | null;
};

/**
 * Mirrors a lead's nearest upcoming appointment back onto `leads.appointment_date`
 * / `leads.attendance_status`.
 *
 * Those legacy columns still drive the statistics page and the "Lịch hẹn" column
 * on the lead table, so keeping them in sync means the multi-appointment feature
 * ships without touching either. When no future appointment remains we fall back
 * to the most recent past one so history is not lost.
 */
async function syncLeadAppointmentColumns(leadId: number): Promise<void> {
  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: upcoming } = await supabase
    .from('lead_appointments')
    .select('appointment_date, attendance_status')
    .eq('lead_id', leadId)
    .gte('appointment_date', nowIso)
    .order('appointment_date', { ascending: true })
    .limit(1);

  let chosen = (upcoming as unknown as LeadAppointment[] | null)?.[0];

  if (!chosen) {
    const { data: past } = await supabase
      .from('lead_appointments')
      .select('appointment_date, attendance_status')
      .eq('lead_id', leadId)
      .order('appointment_date', { ascending: false })
      .limit(1);

    chosen = (past as unknown as LeadAppointment[] | null)?.[0];
  }

  await supabase
    .from('leads')
    .update({
      appointment_date: chosen?.appointment_date ?? null,
      attendance_status: (chosen?.attendance_status ?? AttendanceStatus.NOT_ARRIVED) as never,
    } as never)
    .eq('id', leadId);
}

export async function fetchAppointmentsByLeadId(leadId: number): Promise<LeadAppointment[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('lead_appointments')
      .select('*')
      .eq('lead_id', leadId)
      .order('appointment_date', { ascending: false });

    if (error) {
      handleSupabaseError(error, { defaultErrorCode: AppointmentErrorCode.FETCH_FAILED });
    }

    return (data as unknown as LeadAppointment[]) || [];
  } catch (error) {
    handleServiceError(error, AppointmentErrorCode.FETCH_FAILED);
  }
}

export async function createAppointment(input: CreateAppointmentInput): Promise<LeadAppointment> {
  try {
    const supabase = createAdminClient();

    const insertData: InsertTables<'lead_appointments'> = {
      lead_id: input.lead_id,
      appointment_date: input.appointment_date,
      attendance_status: input.attendance_status ?? AttendanceStatus.NOT_ARRIVED,
      note: input.note ?? null,
      remind_before_min: input.remind_before_min ?? 30,
      created_by: input.created_by ?? null,
    };

    const { data, error } = await supabase
      .from('lead_appointments')
      .insert(insertData as never)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, {
        foreignKeyViolationErrorCode: AppointmentErrorCode.CREATE_FAILED,
        defaultErrorCode: AppointmentErrorCode.CREATE_FAILED,
      });
    }

    await syncLeadAppointmentColumns(input.lead_id);

    return data as unknown as LeadAppointment;
  } catch (error) {
    handleServiceError(error, AppointmentErrorCode.CREATE_FAILED);
  }
}

export async function updateAppointmentById(
  id: number,
  input: UpdateAppointmentInput
): Promise<LeadAppointment> {
  try {
    const supabase = createAdminClient();

    const updateData: UpdateTables<'lead_appointments'> = {
      updated_at: new Date().toISOString(),
    };

    if (input.attendance_status !== undefined) {
      updateData.attendance_status = input.attendance_status;
    }
    if (input.note !== undefined) {
      updateData.note = input.note;
    }
    if (input.remind_before_min !== undefined) {
      updateData.remind_before_min = input.remind_before_min;
    }

    // Changing WHEN the reminder should fire (its date or its offset) re-arms both
    // channels — the in-app bell (reminder_sent_at) and web push (pushed_at) — so
    // the reminder fires again for the new time.
    const timingChanged =
      input.appointment_date !== undefined || input.remind_before_min !== undefined;

    if (input.appointment_date !== undefined) {
      updateData.appointment_date = input.appointment_date;
    }
    if (timingChanged) {
      updateData.reminder_sent_at = null;
      updateData.pushed_at = null;
    }
    // An explicit reminder_sent_at (the bell acknowledging) wins over the re-arm.
    if (input.reminder_sent_at !== undefined) {
      updateData.reminder_sent_at = input.reminder_sent_at;
    }

    const { data, error } = await supabase
      .from('lead_appointments')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      handleSupabaseError(error, {
        notFoundErrorCode: AppointmentErrorCode.NOT_FOUND,
        defaultErrorCode: AppointmentErrorCode.UPDATE_FAILED,
      });
    }

    const appointment = validateDataExists(
      data as unknown as LeadAppointment,
      AppointmentErrorCode.NOT_FOUND
    );

    await syncLeadAppointmentColumns(appointment.lead_id);

    return appointment;
  } catch (error) {
    handleServiceError(error, AppointmentErrorCode.UPDATE_FAILED);
  }
}

export async function deleteAppointmentById(id: number): Promise<void> {
  try {
    const supabase = createAdminClient();

    // Read the owning lead first so the legacy columns can be resynced afterwards.
    const { data: existing } = await supabase
      .from('lead_appointments')
      .select('lead_id')
      .eq('id', id)
      .single();

    const { error } = await supabase.from('lead_appointments').delete().eq('id', id);

    if (error) {
      handleSupabaseError(error, { defaultErrorCode: AppointmentErrorCode.DELETE_FAILED });
    }

    const leadId = (existing as unknown as { lead_id: number } | null)?.lead_id;
    if (leadId) {
      await syncLeadAppointmentColumns(leadId);
    }
  } catch (error) {
    handleServiceError(error, AppointmentErrorCode.DELETE_FAILED);
  }
}

/**
 * Returns appointments whose reminder is due and not yet delivered.
 *
 * "Due" means `appointment_date - remind_before_min <= now`. Postgrest cannot
 * express that arithmetic in a filter, so we narrow with the widest possible
 * window (the largest offset we allow) and compute the exact cut-off in JS.
 *
 * Reminders are scoped to the telesales assigned to the lead, so each one is
 * delivered to exactly one person and the single `reminder_sent_at` flag cannot
 * race between staff. Managers (`canSeeAllLeads`) get the unfiltered feed —
 * including leads with no telesales assigned, which would otherwise reach nobody.
 */
export async function fetchDueReminders(
  telesalesId: string,
  canSeeAllLeads = false
): Promise<DueAppointment[]> {
  try {
    const supabase = createAdminClient();
    const now = Date.now();
    // Widest supported offset (1 week) — anything beyond this cannot be due yet.
    const horizonIso = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
    // Ignore appointments that are long past so a stale row never pops up.
    const floorIso = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('lead_appointments')
      .select('*')
      .is('reminder_sent_at', null)
      .gte('appointment_date', floorIso)
      .lte('appointment_date', horizonIso)
      .order('appointment_date', { ascending: true });

    if (error) {
      handleSupabaseError(error, { defaultErrorCode: AppointmentErrorCode.FETCH_FAILED });
    }

    const candidates = (data as unknown as LeadAppointment[]) || [];

    // Keep only those whose reminder moment has actually arrived.
    const due = candidates.filter((appointment) => {
      const remindAt =
        new Date(appointment.appointment_date).getTime() - appointment.remind_before_min * 60 * 1000;
      return remindAt <= now;
    });

    if (due.length === 0) {
      return [];
    }

    // Attach the display fields, restricting to this telesales' leads unless the
    // caller is allowed to see every lead.
    const leadIds = [...new Set(due.map((appointment) => appointment.lead_id))];
    let leadQuery = supabase
      .from('leads')
      .select('id, full_name, phone_number')
      .in('id', leadIds);

    if (!canSeeAllLeads) {
      leadQuery = leadQuery.eq('telesales_id', telesalesId);
    }

    const { data: leadsData } = await leadQuery;

    const leadMap = new Map(
      ((leadsData as unknown as { id: number; full_name: string | null; phone_number: string | null }[]) || []).map(
        (lead) => [lead.id, lead]
      )
    );

    return due
      .filter((appointment) => leadMap.has(appointment.lead_id))
      .map((appointment) => {
        const lead = leadMap.get(appointment.lead_id);
        return {
          ...appointment,
          lead_full_name: lead?.full_name ?? null,
          lead_phone_number: lead?.phone_number ?? null,
        };
      });
  } catch (error) {
    handleServiceError(error, AppointmentErrorCode.FETCH_FAILED);
  }
}

/** Marks reminders as delivered so they are not shown again. */
export async function markRemindersSent(ids: number[]): Promise<void> {
  if (ids.length === 0) return;

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('lead_appointments')
      .update({ reminder_sent_at: new Date().toISOString() } as never)
      .in('id', ids);

    if (error) {
      handleSupabaseError(error, { defaultErrorCode: AppointmentErrorCode.UPDATE_FAILED });
    }
  } catch (error) {
    handleServiceError(error, AppointmentErrorCode.UPDATE_FAILED);
  }
}
