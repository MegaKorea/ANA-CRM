export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'not_arrived';

/** Nguồn ghi nhận điểm danh: giáo viên đánh dấu tay hay học viên tự quét QR. */
export type AttendanceMethod = 'manual' | 'qr';

/**
 * `student_id` tham chiếu `leads(id)` (bigint) — học viên của lớp được lưu ở
 * `class_students.student_id -> leads(id)`, không phải `users`.
 */
export interface SessionAttendancesTable {
    Row: {
        id: string;
        session_id: string;
        student_id: number;
        status: AttendanceStatus;
        notes: string | null;
        method: AttendanceMethod;
        checked_in_at: string | null;
        checked_in_ip: string | null;
        checked_in_user_agent: string | null;
        created_at: string;
        updated_at: string;
    };
    Insert: {
        id?: string;
        session_id: string;
        student_id: number;
        status: AttendanceStatus;
        notes?: string | null;
        method?: AttendanceMethod;
        checked_in_at?: string | null;
        checked_in_ip?: string | null;
        checked_in_user_agent?: string | null;
        created_at?: string;
        updated_at?: string;
    };
    Update: {
        id?: string;
        session_id?: string;
        student_id?: number;
        status?: AttendanceStatus;
        notes?: string | null;
        method?: AttendanceMethod;
        checked_in_at?: string | null;
        checked_in_ip?: string | null;
        checked_in_user_agent?: string | null;
        updated_at?: string;
    };
}
