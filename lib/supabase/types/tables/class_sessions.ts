export interface ClassSessionsTable {
    Row: {
        id: string;
        class_id: string;
        session_number: number;
        date: string;
        teacher_id: string | null;
        content: string | null;
        room: string | null;
        qr_code_token: string | null;
        qr_code_expires_at: string | null;
        created_at: string;
        updated_at: string;
    };
    Insert: {
        id?: string;
        class_id: string;
        session_number: number;
        date: string;
        teacher_id?: string | null;
        content?: string | null;
        room?: string | null;
        qr_code_token?: string | null;
        qr_code_expires_at?: string | null;
        created_at?: string;
        updated_at?: string;
    };
    Update: {
        id?: string;
        class_id?: string;
        session_number?: number;
        date?: string;
        teacher_id?: string | null;
        content?: string | null;
        room?: string | null;
        qr_code_token?: string | null;
        qr_code_expires_at?: string | null;
        updated_at?: string;
    };
}
