import { LocationValue } from '@/components/common';
import type { LocationValueV2 } from '@/components/common/LocationSelectV2';
import { LeadStatus, AttendanceStatus } from '@/constants/enums';

export interface NoteItem {
  content: string;
  created_at: string;
}

/** One audio-note summarize record: the uploaded file url plus the webhook's response. */
export interface NoteSummarizeItem {
  url: string;
  mime_type: string | null;
  transcript: string | null;
  result: Record<string, unknown> | null;
  created_at: string;
}

export interface LeadsTable {
  Row: {
    id: number;
    email: string | null;
    phone_number: string | null;
    full_name: string;
    date_of_birth: string | null;
    place_of_birth: LocationValue | null;
    place_of_origin: LocationValue | null;
    current_address: LocationValue | null;
    /** New field using provinces.open-api.vn (numeric codes). Replaces current_address for new data. */
    current_address_temp: LocationValueV2 | null;
    citizen_id: string | null;
    nationality: string | null;
    ethnicity: string | null;
    meta_data: Record<string, unknown> | null;
    source: string | null;
    telesales_id: string | null;
    status: LeadStatus;
    note: NoteItem[] | null;
    note_summarize: NoteSummarizeItem[] | null;
    course_ids: string[] | null;

    appointment_date: string | null;
    attendance_status: AttendanceStatus | null;
    images: string[] | null;
    facebook_url: string | null;
    pid_zalo: string | null;
    conversation: string | null;
    tuition_fee: number | null;
    /** Customer potential rating, 0–5 stars (0 = not yet rated). */
    rate: number;
    /** Raw customer object returned by Smax when the lead was captured via an embedded Smax form. */
    smax_log: Record<string, unknown> | null;
    /** True for leads bulk-inserted by a data import/fix rather than created organically; excluded from period-based lead/report stats. */
    is_imported: boolean;
    created_at: string | null;
    updated_at: string | null;
  };
  Insert: {
    id?: number;
    email?: string | null;
    phone_number?: string | null;
    full_name: string;
    date_of_birth?: string | null;
    place_of_birth?: LocationValue | null;
    place_of_origin?: LocationValue | null;
    current_address?: LocationValue | null;
    current_address_temp?: LocationValueV2 | null;
    citizen_id?: string | null;
    nationality?: string | null;
    ethnicity?: string | null;
    meta_data?: Record<string, unknown> | null;
    source?: string | null;
    telesales_id?: string | null;
    status?: LeadStatus;
    note?: NoteItem[] | null;
    note_summarize?: NoteSummarizeItem[] | null;
    course_ids?: string[] | null;

    appointment_date?: string | null;
    attendance_status?: AttendanceStatus | null;
    images?: string[] | null;
    facebook_url?: string | null;
    pid_zalo?: string | null;
    conversation?: string | null;
    tuition_fee?: number | null;
    rate?: number;
    smax_log?: Record<string, unknown> | null;
    is_imported?: boolean;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Update: {
    id?: number;
    email?: string | null;
    phone_number?: string | null;
    full_name?: string;
    date_of_birth?: string | null;
    place_of_birth?: LocationValue | null;
    place_of_origin?: LocationValue | null;
    current_address?: LocationValue | null;
    current_address_temp?: LocationValueV2 | null;
    citizen_id?: string | null;
    nationality?: string | null;
    ethnicity?: string | null;
    meta_data?: Record<string, unknown> | null;
    source?: string | null;
    telesales_id?: string | null;
    status?: LeadStatus;
    note?: NoteItem[] | null;
    note_summarize?: NoteSummarizeItem[] | null;
    course_ids?: string[] | null;

    appointment_date?: string | null;
    attendance_status?: AttendanceStatus | null;
    images?: string[] | null;
    facebook_url?: string | null;
    pid_zalo?: string | null;
    conversation?: string | null;
    tuition_fee?: number | null;
    rate?: number;
    smax_log?: Record<string, unknown> | null;
    is_imported?: boolean;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Relationships: [];
}
