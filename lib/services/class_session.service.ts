import { createAdminClient } from '@/lib/supabase/admin';
import type { AttendanceStatus } from '@/lib/supabase/types/tables/session_attendances';

// ─── Interfaces ──────────────────────────────────────────────────────────

export interface ClassSession {
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
    teacher?: {
        id: string;
        full_name: string;
        email: string;
        phone: string | null;
    } | null;
}

export interface SessionAttendance {
    id: string;
    session_id: string;
    student_id: string;
    status: AttendanceStatus;
    notes: string | null;
    created_at: string;
    updated_at: string;
    student?: {
        id: string;
        full_name: string;
        email: string;
        phone: string | null;
    } | null;
}

// ─── Class Sessions CRUD ─────────────────────────────────────────────────

const SESSION_SELECT = `
    *,
    teacher:users!class_sessions_teacher_id_fkey(
        id,
        full_name,
        email,
        phone
    )
`;

export async function getClassSessions(classId: string): Promise<ClassSession[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('class_sessions')
        .select(SESSION_SELECT)
        .eq('class_id', classId)
        .order('session_number', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return (data as unknown as ClassSession[]) || [];
}

export async function getSessionById(sessionId: string): Promise<ClassSession> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('class_sessions')
        .select(SESSION_SELECT)
        .eq('id', sessionId)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data as unknown as ClassSession;
}

export async function updateSession(
    sessionId: string,
    updates: { teacher_id?: string | null; content?: string | null; date?: string; room?: string | null }
): Promise<ClassSession> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('class_sessions')
        .update(updates as never)
        .eq('id', sessionId)
        .select(SESSION_SELECT)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data as unknown as ClassSession;
}

// ─── Auto-generate Sessions ──────────────────────────────────────────────

export async function generateSessionsForClass(
    classId: string,
    startDate: string,
    endDate: string,
    _schedule?: string | null
): Promise<ClassSession[]> {
    const supabase = createAdminClient();
    const dayjs = (await import('dayjs')).default;

    // Delete existing sessions for this class first
    const { error: deleteError } = await supabase
        .from('class_sessions')
        .delete()
        .eq('class_id', classId);

    if (deleteError) {
        throw new Error(`Failed to clear old sessions: ${deleteError.message}`);
    }

    // Generate session rows (skip Sundays by default)
    const sessions: { class_id: string; session_number: number; date: string }[] = [];
    let current = dayjs(startDate);
    const end = dayjs(endDate);
    let sessionNumber = 1;

    while (current.isBefore(end) || current.isSame(end, 'day')) {
        // Skip Sundays (day() === 0)
        if (current.day() !== 0) {
            sessions.push({
                class_id: classId,
                session_number: sessionNumber++,
                date: current.format('YYYY-MM-DD'),
            });
        }
        current = current.add(1, 'day');
    }

    if (sessions.length === 0) {
        return [];
    }

    const { data, error } = await supabase
        .from('class_sessions')
        .insert(sessions as never[])
        .select(SESSION_SELECT);

    if (error) {
        throw new Error(error.message);
    }

    return (data as unknown as ClassSession[]) || [];
}

// ─── QR Code ─────────────────────────────────────────────────────────────

export async function generateQrCodeToken(sessionId: string): Promise<{ token: string; expiresAt: string }> {
    const supabase = createAdminClient();
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes

    const { error } = await supabase
        .from('class_sessions')
        .update({ qr_code_token: token, qr_code_expires_at: expiresAt } as never)
        .eq('id', sessionId);

    if (error) {
        throw new Error(error.message);
    }

    return { token, expiresAt };
}

export async function verifyQrCodeAndMarkAttendance(
    token: string,
    studentId: string
): Promise<SessionAttendance> {
    const supabase = createAdminClient();

    // Find session by token
    const { data: session, error: sessionError } = await supabase
        .from('class_sessions')
        .select('id, qr_code_token, qr_code_expires_at')
        .eq('qr_code_token', token)
        .single();

    if (sessionError || !session) {
        throw new Error('Mã QR không hợp lệ hoặc đã hết hạn.');
    }

    const sessionData = session as any;
    if (sessionData.qr_code_expires_at && new Date(sessionData.qr_code_expires_at) < new Date()) {
        throw new Error('Mã QR đã hết hạn.');
    }

    // Upsert attendance record
    const { data, error } = await supabase
        .from('session_attendances')
        .upsert(
            {
                session_id: sessionData.id,
                student_id: studentId,
                status: 'present',
            } as never,
            { onConflict: 'session_id,student_id' }
        )
        .select('*')
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data as unknown as SessionAttendance;
}

// ─── Attendances CRUD ────────────────────────────────────────────────────

const ATTENDANCE_SELECT = `
    *,
    student:users!session_attendances_student_id_fkey(
        id,
        full_name,
        email,
        phone
    )
`;

export async function getSessionAttendances(sessionId: string): Promise<SessionAttendance[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('session_attendances')
        .select(ATTENDANCE_SELECT)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return (data as unknown as SessionAttendance[]) || [];
}

export async function upsertAttendance(
    sessionId: string,
    studentId: string,
    status: AttendanceStatus,
    notes?: string | null
): Promise<SessionAttendance> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('session_attendances')
        .upsert(
            {
                session_id: sessionId,
                student_id: studentId,
                status,
                notes: notes ?? null,
            } as never,
            { onConflict: 'session_id,student_id' }
        )
        .select(ATTENDANCE_SELECT)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data as unknown as SessionAttendance;
}

export async function bulkUpsertAttendances(
    sessionId: string,
    records: { student_id: string; status: AttendanceStatus; notes?: string | null }[]
): Promise<SessionAttendance[]> {
    const supabase = createAdminClient();
    const rows = records.map((r) => ({
        session_id: sessionId,
        student_id: r.student_id,
        status: r.status,
        notes: r.notes ?? null,
    }));

    const { data, error } = await supabase
        .from('session_attendances')
        .upsert(rows as never[], { onConflict: 'session_id,student_id' })
        .select(ATTENDANCE_SELECT);

    if (error) {
        throw new Error(error.message);
    }

    return (data as unknown as SessionAttendance[]) || [];
}
