export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused' | 'not_arrived';

export interface SessionAttendancesTable {
    Row: {
        id: string;
        session_id: string;
        student_id: string;
        status: AttendanceStatus;
        notes: string | null;
        created_at: string;
        updated_at: string;
    };
    Insert: {
        id?: string;
        session_id: string;
        student_id: string;
        status: AttendanceStatus;
        notes?: string | null;
        created_at?: string;
        updated_at?: string;
    };
    Update: {
        id?: string;
        session_id?: string;
        student_id?: string;
        status?: AttendanceStatus;
        notes?: string | null;
        updated_at?: string;
    };
}
