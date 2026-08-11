import { AttendanceStatus, HttpStatusCode, LeadErrorCode, LeadStatus } from '@/constants/enums';
import { createAdminClient } from '@/lib/supabase/admin';
import { splitIntoVnDaySegments } from '@/lib/utils/vn-date';
import type { NoteItem } from '@/lib/supabase/types/tables/leads';
import { AppError } from '@/errors';
import { getActiveLeadClassificationRule } from '@/lib/services/lead-classification-rule.service';

const MAX_REPORT_DAYS = 62;

const FETCH_PAGE_SIZE = 1000;

interface ActiveClassificationRule {
  recentInteractionHours: number;
  racKqtStatuses: LeadStatus[];
}

const DEFAULT_CLASSIFICATION_RULE: ActiveClassificationRule = {
  recentInteractionHours: 24,
  racKqtStatuses: [LeadStatus.REJECT, LeadStatus.NOT_INTERESTED],
};

async function resolveActiveClassificationRule(): Promise<ActiveClassificationRule> {
  const activeRule = await getActiveLeadClassificationRule().catch(() => null);
  if (!activeRule) return DEFAULT_CLASSIFICATION_RULE;

  return {
    recentInteractionHours: activeRule.recent_interaction_hours,
    racKqtStatuses: activeRule.rac_kqt_statuses as LeadStatus[],
  };
}

async function fetchAllRows<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await buildQuery(from, from + FETCH_PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < FETCH_PAGE_SIZE) break;
    from += FETCH_PAGE_SIZE;
  }
  return rows;
}

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

function classifyLead(
  lead: ReportLeadRow,
  endAtMs: number,
  rule: ActiveClassificationRule,
): InteractionBucket {
  if (lead.status && rule.racKqtStatuses.includes(lead.status)) {
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
  return hoursSinceNote <= rule.recentInteractionHours ? 'tuongTacQuanTam' : 'itTuongTac';
}

async function computeTeamSalesReportRow(
  startAt: string,
  endAt: string,
  rule: ActiveClassificationRule,
): Promise<TeamSalesReportRow> {
  const supabase = createAdminClient();
  const endAtMs = new Date(endAt).getTime();

  const [createdLeads, arrivedLeadsRes, convertedLeads, revenueTickets] = await Promise.all([
    fetchAllRows<ReportLeadRow>((from, to) =>
      supabase
        .from('leads')
        .select('id, status, note')
        .gte('created_at', startAt)
        .lte('created_at', endAt)
        .range(from, to),
    ),
    supabase
      .from('lead_appointments')
      .select('id', { count: 'exact', head: true })
      .gte('appointment_date', startAt)
      .lte('appointment_date', endAt)
      .eq('attendance_status', AttendanceStatus.ARRIVED),

    fetchAllRows<{ id: number; tuition_fee: number | null }>((from, to) =>
      supabase
        .from('leads')
        .select('id, tuition_fee')
        .eq('status', LeadStatus.CONVERTED)
        .gte('updated_at', startAt)
        .lte('updated_at', endAt)
        .range(from, to),
    ),
    fetchAllRows<{ amount: number }>((from, to) =>
      supabase
        .from('payment_tickets')
        .select('amount')
        .eq('status', 'approved')
        .gte('payment_date', startAt)
        .lte('payment_date', endAt)
        .range(from, to),
    ),
  ]);

  if (arrivedLeadsRes.error) throw arrivedLeadsRes.error;

  const buckets = {
    chamZalo: 0,
    tuongTacQuanTam: 0,
    itTuongTac: 0,
    chuaTiepCan: 0,
    racKqt: 0,
  };
  for (const lead of createdLeads) {
    const bucket = classifyLead(lead, endAtMs, rule);
    if (bucket) buckets[bucket] += 1;
  }

  const doanhThu = revenueTickets.reduce((sum, ticket) => sum + ticket.amount, 0);

  let congNo = 0;
  if (convertedLeads.length) {
    const leadIds = convertedLeads.map((lead) => lead.id);
    const allPayments = await fetchAllRows<{ lead_id: number; amount: number }>((from, to) =>
      supabase
        .from('payment_tickets')
        .select('lead_id, amount')
        .eq('status', 'approved')
        .in('lead_id', leadIds)
        .range(from, to),
    );

    const paidByLead = new Map<number, number>();
    for (const payment of allPayments) {
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
  splitByDay = false,
): Promise<TeamSalesReportRow[]> {
  // Single source of truth for "how many (VN calendar) days does this span"
  // — also doubles as the per-day segments used below when splitByDay.
  const segments = splitIntoVnDaySegments(startAt, endAt);

  if (segments.length > MAX_REPORT_DAYS) {
    throw new AppError(
      LeadErrorCode.BAD_REQUEST,
      HttpStatusCode.BAD_REQUEST,
      `Khoảng thời gian quá dài (tối đa ${MAX_REPORT_DAYS} ngày)`,
    );
  }

  const rule = await resolveActiveClassificationRule();

  if (!splitByDay) {
    // A single row covering the whole selected range.
    return [await computeTeamSalesReportRow(startAt, endAt, rule)];
  }

  // One row per calendar day (VN timezone) — the first/last segment keep
  // the exact startAt/endAt so a range like "17h ngày 10 → 10h ngày 11"
  // still only produces 2 rows, not a padded full day on each end.
  return Promise.all(segments.map((segment) => computeTeamSalesReportRow(segment.start, segment.end, rule)));
}
