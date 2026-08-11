import { AttendanceStatus, HttpStatusCode, LeadErrorCode, LeadStatus } from '@/constants/enums';
import { createAdminClient } from '@/lib/supabase/admin';
import { quotePostgrestValue, splitIntoVnDaySegments } from '@/lib/utils/vn-date';
import type { NoteItem } from '@/lib/supabase/types/tables/leads';
import { AppError } from '@/errors';

const MAX_REPORT_DAYS = 62;

const RECENT_INTERACTION_HOURS = 24;

export interface TeamSalesReportRow {
  startAt: string;
  endAt: string;
  dataNhan: number;
  chamZalo: number;
  tuongTacQuanTam: number;
  itTuongTac: number;
  chuaTiepCan: number;
  racKqt: number;
  slHvDen: number;
  slHvChot: number;
  doanhThu: number;
  congNo: number;
  ghiChu: string;
}

interface ReportLeadRow {
  id: number;
  status: LeadStatus | null;
  note: NoteItem[] | null;
}

function lastNoteAt(note: NoteItem[] | null): number | null {
  if (!note?.length) return null;
  const timestamps = note
    .map((item) => new Date(item.created_at).getTime())
    .filter((time) => !Number.isNaN(time));
  return timestamps.length ? Math.max(...timestamps) : null;
}

type InteractionBucket =
  | 'racKqt'
  | 'chuaTiepCan'
  | 'chamZalo'
  | 'tuongTacQuanTam'
  | 'itTuongTac'
  | null;

function classifyLead(lead: ReportLeadRow, endAtMs: number): InteractionBucket {
  if (lead.status === LeadStatus.REJECT || lead.status === LeadStatus.NOT_INTERESTED) {
    return 'racKqt';
  }
  if (lead.status === LeadStatus.CONVERTED) {
    return null;
  }
  if (lead.status === LeadStatus.NOT_CONTACTED) {
    return 'chuaTiepCan';
  }
  if (lead.status === LeadStatus.NURTURING) {
    return 'chamZalo';
  }

  const noteAt = lastNoteAt(lead.note);
  if (noteAt == null) return 'chuaTiepCan';

  const hoursSinceNote = (endAtMs - noteAt) / (60 * 60 * 1000);
  return hoursSinceNote <= RECENT_INTERACTION_HOURS ? 'tuongTacQuanTam' : 'itTuongTac';
}

async function computeTeamSalesReportRow(
  startAt: string,
  endAt: string,
): Promise<TeamSalesReportRow> {
  const supabase = createAdminClient();
  const start = quotePostgrestValue(startAt);
  const end = quotePostgrestValue(endAt);
  const endAtMs = new Date(endAt).getTime();

  const [createdLeadsRes, arrivedLeadsRes, convertedLeadsRes, revenueTicketsRes] =
    await Promise.all([
      supabase
        .from('leads')
        .select('id, status, note')
        .gte('created_at', startAt)
        .lte('created_at', endAt),
      supabase
        .from('lead_appointments')
        .select('id', { count: 'exact', head: true })
        .gte('appointment_date', startAt)
        .lte('appointment_date', endAt)
        .eq('attendance_status', AttendanceStatus.ARRIVED),
      supabase
        .from('leads')
        .select('id, tuition_fee')
        .eq('status', LeadStatus.CONVERTED)
        .or(
          [
            `and(created_at.gte.${start},created_at.lte.${end})`,
            `and(updated_at.gte.${start},updated_at.lte.${end})`,
          ].join(','),
        ),
      supabase
        .from('payment_tickets')
        .select('amount')
        .eq('status', 'approved')
        .gte('payment_date', startAt)
        .lte('payment_date', endAt),
    ]);

  if (createdLeadsRes.error) throw createdLeadsRes.error;
  if (arrivedLeadsRes.error) throw arrivedLeadsRes.error;
  if (convertedLeadsRes.error) throw convertedLeadsRes.error;
  if (revenueTicketsRes.error) throw revenueTicketsRes.error;

  const createdLeads = (createdLeadsRes.data ?? []) as unknown as ReportLeadRow[];
  const convertedLeads = (convertedLeadsRes.data ?? []) as unknown as {
    id: number;
    tuition_fee: number | null;
  }[];
  const revenueTickets = (revenueTicketsRes.data ?? []) as unknown as { amount: number }[];

  const buckets = {
    chamZalo: 0,
    tuongTacQuanTam: 0,
    itTuongTac: 0,
    chuaTiepCan: 0,
    racKqt: 0,
  };
  for (const lead of createdLeads) {
    const bucket = classifyLead(lead, endAtMs);
    if (bucket) buckets[bucket] += 1;
  }

  const doanhThu = revenueTickets.reduce((sum, ticket) => sum + ticket.amount, 0);

  let congNo = 0;
  if (convertedLeads.length) {
    const leadIds = convertedLeads.map((lead) => lead.id);
    const { data: allPayments, error: paymentsError } = await supabase
      .from('payment_tickets')
      .select('lead_id, amount')
      .eq('status', 'approved')
      .in('lead_id', leadIds);
    if (paymentsError) throw paymentsError;

    const paidByLead = new Map<number, number>();
    for (const payment of (allPayments ?? []) as unknown as {
      lead_id: number;
      amount: number;
    }[]) {
      paidByLead.set(payment.lead_id, (paidByLead.get(payment.lead_id) ?? 0) + payment.amount);
    }

    congNo = convertedLeads.reduce((sum, lead) => {
      const owed = (lead.tuition_fee ?? 0) - (paidByLead.get(lead.id) ?? 0);
      return sum + Math.max(0, owed);
    }, 0);
  }

  return {
    startAt,
    endAt,
    dataNhan: createdLeads.length,
    chamZalo: buckets.chamZalo,
    tuongTacQuanTam: buckets.tuongTacQuanTam,
    itTuongTac: buckets.itTuongTac,
    chuaTiepCan: buckets.chuaTiepCan,
    racKqt: buckets.racKqt,
    slHvDen: arrivedLeadsRes.count ?? 0,
    slHvChot: convertedLeads.length,
    doanhThu,
    congNo,
    ghiChu: '',
  };
}

export async function getTeamSalesReportRows(
  startAt: string,
  endAt: string,
): Promise<TeamSalesReportRow[]> {
  const segments = splitIntoVnDaySegments(startAt, endAt);

  if (segments.length > MAX_REPORT_DAYS) {
    throw new AppError(
      LeadErrorCode.BAD_REQUEST,
      HttpStatusCode.BAD_REQUEST,
      `Khoảng thời gian quá dài (tối đa ${MAX_REPORT_DAYS} ngày)`,
    );
  }

  return Promise.all(
    segments.map((segment) => computeTeamSalesReportRow(segment.start, segment.end)),
  );
}
