import { createAdminClient } from '@/lib/supabase/admin';
import { handleServiceError, handleSupabaseError, validateDataExists } from '@/lib/utils/error-handler';
import { AppointmentErrorCode, AttendanceStatus } from '@/constants/enums';
import type {
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '@/lib/validators/appointment.validator';
import type { LeadAppointmentsTable } from '@/lib/supabase/types/tables/lead_appointments';
import type { InsertTables, UpdateTables } from '@/types/supabase';
import {
  addDaysIsoDate,
  toVnDate,
  vnDayEndIso,
  vnDayStartIso,
} from '@/lib/utils/vn-date';

export type LeadAppointment = LeadAppointmentsTable['Row'];

export type DueAppointment = LeadAppointment & {
  lead_full_name: string | null;
  lead_phone_number: string | null;
};

export type UpcomingAppointmentChannel = 'facebook' | 'zalo' | null;

export type UpcomingAppointment = {
  id: number;
  lead_id: number;
  appointment_date: string;
  note: string | null;
  lead_full_name: string | null;
  channel: UpcomingAppointmentChannel;
};

type LeadUpcomingRow = {
  id: number;
  full_name: string | null;
  facebook_url: string | null;
  pid_zalo: string | null;
  source: string | null;
  appointment_date: string;
  note: { content?: string }[] | null;
};

function resolveChannel(lead: LeadUpcomingRow): UpcomingAppointmentChannel {
  if (lead.pid_zalo) return 'zalo';
  if (lead.facebook_url || lead.source === 'facebook' || lead.source === 'smax') {
    return 'facebook';
  }
  return null;
}

function latestNoteText(note: LeadUpcomingRow['note']): string | null {
  if (!Array.isArray(note) || note.length === 0) return null;
  const last = note[note.length - 1];
  const content = typeof last?.content === 'string' ? last.content.trim() : '';
  return content || null;
}

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

export async function fetchDueReminders(
  telesalesId: string,
  canSeeAllLeads = false
): Promise<DueAppointment[]> {
  try {
    const supabase = createAdminClient();
    const now = Date.now();
    const horizonIso = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
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

    const due = candidates.filter((appointment) => {
      const remindAt =
        new Date(appointment.appointment_date).getTime() - appointment.remind_before_min * 60 * 1000;
      return remindAt <= now;
    });

    if (due.length === 0) {
      return [];
    }

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

const UPCOMING_HORIZON_DAYS = 14;

function mapLeadRowsToUpcoming(rows: LeadUpcomingRow[]): UpcomingAppointment[] {
  return rows.map((lead) => ({
    id: lead.id,
    lead_id: lead.id,
    appointment_date: lead.appointment_date,
    note: latestNoteText(lead.note),
    lead_full_name: lead.full_name,
    channel: resolveChannel(lead),
  }));
}

export async function fetchAppointmentsInRange(
  startDate: string,
  endDate: string,
): Promise<UpcomingAppointment[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('leads')
      .select('id, full_name, facebook_url, pid_zalo, source, appointment_date, note')
      .not('appointment_date', 'is', null)
      .gte('appointment_date', vnDayStartIso(startDate))
      .lte('appointment_date', vnDayEndIso(endDate))
      .order('appointment_date', { ascending: true });

    if (error) {
      handleSupabaseError(error, { defaultErrorCode: AppointmentErrorCode.FETCH_FAILED });
    }

    return mapLeadRowsToUpcoming((data as unknown as LeadUpcomingRow[]) || []);
  } catch (error) {
    handleServiceError(error, AppointmentErrorCode.FETCH_FAILED);
  }
}

export async function fetchUpcomingAppointments(): Promise<UpcomingAppointment[]> {
  try {
    const today = toVnDate(new Date().toISOString());
    const lastDay = addDaysIsoDate(today, UPCOMING_HORIZON_DAYS - 1);
    return await fetchAppointmentsInRange(today, lastDay);
  } catch (error) {
    handleServiceError(error, AppointmentErrorCode.FETCH_FAILED);
  }
}
