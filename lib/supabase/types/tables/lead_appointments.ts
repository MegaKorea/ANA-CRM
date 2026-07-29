import type { AttendanceStatus } from '@/constants/enums';

export interface LeadAppointmentsTable {
  Row: {
    id: number;
    lead_id: number;
    appointment_date: string;
    attendance_status: AttendanceStatus;
    note: string | null;
    /** Minutes before `appointment_date` the reminder should fire. */
    remind_before_min: number;
    /** Set once the in-app bell reminder has been shown, so it never fires twice. */
    reminder_sent_at: string | null;
    /** Set once the web-push notification has been sent (separate channel). */
    pushed_at: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: number;
    lead_id: number;
    appointment_date: string;
    attendance_status?: AttendanceStatus;
    note?: string | null;
    remind_before_min?: number;
    reminder_sent_at?: string | null;
    pushed_at?: string | null;
    created_by?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: number;
    lead_id?: number;
    appointment_date?: string;
    attendance_status?: AttendanceStatus;
    note?: string | null;
    remind_before_min?: number;
    reminder_sent_at?: string | null;
    pushed_at?: string | null;
    created_by?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
}
