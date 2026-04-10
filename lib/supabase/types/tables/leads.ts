import { LocationValue } from '@/components/common';
import type { LocationValueV2 } from '@/components/common/LocationSelectV2';
import { LeadStatus, AttendanceStatus } from '@/constants/enums';

export interface NoteItem {
  content: string;
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
    course_ids: string[] | null;
    sales_amount: number | null;
    deposit: number | null;
    outstanding_balance: number | null;
    appointment_date: string | null;
    attendance_status: AttendanceStatus | null;
    images: string[] | null;
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
    course_ids?: string[] | null;
    sales_amount?: number | null;
    deposit?: number | null;
    outstanding_balance?: number | null;
    appointment_date?: string | null;
    attendance_status?: AttendanceStatus | null;
    images?: string[] | null;
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
    course_ids?: string[] | null;
    sales_amount?: number | null;
    deposit?: number | null;
    outstanding_balance?: number | null;
    appointment_date?: string | null;
    attendance_status?: AttendanceStatus | null;
    images?: string[] | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Relationships: [];
}
