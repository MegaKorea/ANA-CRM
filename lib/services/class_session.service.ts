import { createAdminClient } from '@/lib/supabase/admin';
import type { AttendanceStatus } from '@/lib/supabase/types/tables/session_attendances';
import { fail, throwIfSupabaseError } from '@/errors';
import { HttpStatusCode, LectureErrorCode } from '@/constants/enums';
import { randomBytes, randomUUID } from 'crypto';
import {
    buildBodyJsonWithLectures,
    countPublishedLectures,
    parseSessionLectures,
    type SessionLecture,
    type SessionLectureAttachment,
    type SessionLectureLink,
    type SessionLectureStatus,
} from '@/lib/types/session-lecture';

// ─── Types ───────────────────────────────────────────────────────────────

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
    body_json: Record<string, unknown> | null;
    attachments: unknown[] | null;
    has_content: boolean;
    has_quiz: boolean;
    lectures: SessionLecture[];
    created_at: string;
    updated_at: string;
    hasAttendance?: boolean;
    attendanceMarkedCount?: number;
    teacher?: {
        id: string;
        full_name: string;
        email: string;
        phone: string | null;
    } | null;
}

export type { SessionLecture, SessionLectureAttachment, SessionLectureLink };

export type SessionLectureInput = {
    title: string;
    html?: string;
    links?: SessionLectureLink[];
    attachments?: SessionLectureAttachment[];
    sort_order?: number;
    status?: SessionLectureStatus;
};

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

export type VerifyQrResult = SessionAttendance & {
    class_id: string;
    session_date: string;
};

// ─── Constants ───────────────────────────────────────────────────────────

const QR_TTL_MS = 30 * 60 * 1000;

const SESSION_TEACHER_SELECT = `
    teacher:users!class_sessions_teacher_id_fkey(
        id,
        full_name,
        email,
        phone
    )
`;

const SESSION_SELECT = `*, ${SESSION_TEACHER_SELECT}`;

const SESSION_LIST_SELECT = `
    *,
    ${SESSION_TEACHER_SELECT},
    session_attendances(status, student_id)
`;

const ATTENDANCE_SELECT = `
    *,
    student:users!session_attendances_student_id_fkey(
        id,
        full_name,
        email,
        phone
    )
`;

const MARKED_ATTENDANCE_STATUSES = new Set(['present', 'absent', 'late', 'excused']);

// Deduplicate concurrent QR verifies (double mount / double click)
const verifyInflight = new Map<string, Promise<VerifyQrResult>>();

// ─── Session helpers ─────────────────────────────────────────────────────

function mapSessionRow(
    row: Record<string, unknown>,
    opts?: { viewerUserId?: string | null; redactQr?: boolean },
): ClassSession {
    const viewerUserId = opts?.viewerUserId;
    const attendanceRows = row.session_attendances as
        | Array<{ status?: string; student_id?: string }>
        | null
        | undefined;
    const marked = Array.isArray(attendanceRows)
        ? attendanceRows.filter((a) => !!a?.status && MARKED_ATTENDANCE_STATUSES.has(a.status))
        : [];

    const hasAttendance = viewerUserId
        ? marked.some((a) => a.student_id === viewerUserId)
        : marked.length > 0;

    const redactQr = !!opts?.redactQr;

    const bodyJson = (row.body_json as Record<string, unknown> | null) ?? null;
    const lectures = parseSessionLectures(bodyJson);

    return {
        id: row.id as string,
        class_id: row.class_id as string,
        session_number: row.session_number as number,
        date: row.date as string,
        teacher_id: (row.teacher_id as string | null) ?? null,
        content: (row.content as string | null) ?? null,
        room: (row.room as string | null) ?? null,
        qr_code_token: redactQr ? null : ((row.qr_code_token as string | null) ?? null),
        qr_code_expires_at: redactQr ? null : ((row.qr_code_expires_at as string | null) ?? null),
        body_json: bodyJson,
        attachments: Array.isArray(row.attachments) ? (row.attachments as unknown[]) : [],
        has_content: Boolean(row.has_content) || countPublishedLectures(lectures) > 0,
        has_quiz: Boolean(row.has_quiz),
        lectures,
        created_at: row.created_at as string,
        updated_at: row.updated_at as string,
        teacher: (row.teacher as ClassSession['teacher']) ?? null,
        hasAttendance,
        attendanceMarkedCount: marked.length,
    };
}

// ─── Sessions CRUD ───────────────────────────────────────────────────────

export async function getClassSessions(
    classId: string,
    opts?: { viewerUserId?: string | null; redactQr?: boolean },
): Promise<ClassSession[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('class_sessions')
        .select(SESSION_LIST_SELECT)
        .eq('class_id', classId)
        .order('session_number', { ascending: true });

    throwIfSupabaseError(error);

    return ((data as unknown as Record<string, unknown>[]) || []).map((row) =>
        mapSessionRow(row, {
            viewerUserId: opts?.viewerUserId,
            redactQr: opts?.redactQr,
        }),
    );
}

export async function getSessionById(sessionId: string): Promise<ClassSession> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('class_sessions')
        .select(SESSION_SELECT)
        .eq('id', sessionId)
        .single();

    throwIfSupabaseError(error);
    if (!data) {
        fail('SESSION_NOT_FOUND', HttpStatusCode.NOT_FOUND, 'Không tìm thấy buổi học.');
    }
    return mapSessionRow(data as unknown as Record<string, unknown>);
}

/** Lightweight session fetch for APIs that only need class/date meta (avoids body_json). */
export async function getSessionMetaById(
    sessionId: string,
): Promise<Pick<ClassSession, 'id' | 'class_id' | 'date' | 'session_number'>> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('class_sessions')
        .select('id, class_id, date, session_number')
        .eq('id', sessionId)
        .single();

    throwIfSupabaseError(error);
    if (!data) {
        fail('SESSION_NOT_FOUND', HttpStatusCode.NOT_FOUND, 'Không tìm thấy buổi học.');
    }
    const row = data as unknown as {
        id: string;
        class_id: string;
        date: string;
        session_number: number;
    };
    return {
        id: row.id,
        class_id: row.class_id,
        date: row.date,
        session_number: row.session_number,
    };
}

async function persistSessionLectures(
    sessionId: string,
    bodyJson: unknown,
    lectures: SessionLecture[],
): Promise<ClassSession> {
    const supabase = createAdminClient();
    const nextBody = buildBodyJsonWithLectures(bodyJson, lectures);
    const { data, error } = await supabase
        .from('class_sessions')
        .update({
            body_json: nextBody,
            has_content: countPublishedLectures(lectures) > 0,
            updated_at: new Date().toISOString(),
        } as never)
        .eq('id', sessionId)
        .select(SESSION_SELECT)
        .single();

    throwIfSupabaseError(error, LectureErrorCode.SAVE_FAILED);
    if (!data) {
        fail('SESSION_NOT_FOUND', HttpStatusCode.NOT_FOUND, 'Không tìm thấy buổi học.');
    }
    return mapSessionRow(data as unknown as Record<string, unknown>);
}

export async function listSessionLectures(
    sessionId: string,
    opts?: { includeDrafts?: boolean },
): Promise<SessionLecture[]> {
    const session = await getSessionById(sessionId);
    if (opts?.includeDrafts) return session.lectures;
    return session.lectures.filter((item) => item.status !== 'draft');
}

export async function createSessionLecture(
    sessionId: string,
    input: SessionLectureInput,
): Promise<SessionLecture> {
    const session = await getSessionById(sessionId);
    const now = new Date().toISOString();
    const lecture: SessionLecture = {
        id: randomUUID(),
        title: input.title.trim(),
        html: (input.html ?? '').trim(),
        links: input.links ?? [],
        attachments: input.attachments ?? [],
        sort_order: input.sort_order ?? session.lectures.length,
        updated_at: now,
        status: input.status === 'draft' ? 'draft' : 'published',
    };
    const next = [...session.lectures, lecture];
    const updated = await persistSessionLectures(sessionId, session.body_json, next);
    const created = updated.lectures.find((item) => item.id === lecture.id);
    if (!created) {
        fail(LectureErrorCode.SAVE_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
    return created;
}

export async function updateSessionLecture(
    sessionId: string,
    lectureId: string,
    input: Partial<SessionLectureInput>,
): Promise<SessionLecture> {
    const session = await getSessionById(sessionId);
    const index = session.lectures.findIndex((item) => item.id === lectureId);
    if (index < 0) {
        fail(LectureErrorCode.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    const current = session.lectures[index];
    const nextLecture: SessionLecture = {
        ...current,
        title: input.title !== undefined ? input.title.trim() : current.title,
        html: input.html !== undefined ? input.html.trim() : current.html,
        links: input.links !== undefined ? input.links : current.links,
        attachments: input.attachments !== undefined ? input.attachments : current.attachments,
        sort_order: input.sort_order !== undefined ? input.sort_order : current.sort_order,
        status:
            input.status !== undefined
                ? input.status === 'draft'
                    ? 'draft'
                    : 'published'
                : current.status,
        updated_at: new Date().toISOString(),
    };

    const next = session.lectures.map((item, i) => (i === index ? nextLecture : item));
    const updated = await persistSessionLectures(sessionId, session.body_json, next);
    const saved = updated.lectures.find((item) => item.id === lectureId);
    if (!saved) {
        fail(LectureErrorCode.SAVE_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
    return saved;
}

export async function deleteSessionLecture(
    sessionId: string,
    lectureId: string,
): Promise<void> {
    const session = await getSessionById(sessionId);
    if (!session.lectures.some((item) => item.id === lectureId)) {
        fail(LectureErrorCode.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }
    const next = session.lectures.filter((item) => item.id !== lectureId);
    await persistSessionLectures(sessionId, session.body_json, next);
}

export async function updateSession(
    sessionId: string,
    updates: { teacher_id?: string | null; content?: string | null; date?: string; room?: string | null },
): Promise<ClassSession> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('class_sessions')
        .update(updates as never)
        .eq('id', sessionId)
        .select(SESSION_SELECT)
        .single();

    throwIfSupabaseError(error);
    return data as unknown as ClassSession;
}

export async function generateSessionsForClass(
    classId: string,
    startDate: string,
    endDate: string,
    _schedule?: string | null,
): Promise<ClassSession[]> {
    void _schedule;
    const supabase = createAdminClient();
    const dayjs = (await import('dayjs')).default;

    const { error: deleteError } = await supabase
        .from('class_sessions')
        .delete()
        .eq('class_id', classId);

    throwIfSupabaseError(deleteError, 'Không xoá được lịch cũ.');

    const sessions: { class_id: string; session_number: number; date: string }[] = [];
    let current = dayjs(startDate);
    const end = dayjs(endDate);
    let sessionNumber = 1;

    while (current.isBefore(end) || current.isSame(end, 'day')) {
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

    throwIfSupabaseError(error, 'Không tạo được lịch học.');
    return (data as unknown as ClassSession[]) || [];
}

// ─── QR ──────────────────────────────────────────────────────────────────

export async function generateQrCodeToken(
    sessionId: string,
): Promise<{ token: string; expiresAt: string }> {
    const supabase = createAdminClient();
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + QR_TTL_MS).toISOString();

    const { error } = await supabase
        .from('class_sessions')
        .update({ qr_code_token: token, qr_code_expires_at: expiresAt } as never)
        .eq('id', sessionId);

    throwIfSupabaseError(error, 'Không tạo được mã QR.');
    return { token, expiresAt };
}

async function resolveStudentLeadId(
    userId: string,
    leadId: number | null,
    phone: string | null,
): Promise<number> {
    if (leadId != null) {
        return leadId;
    }

    if (!phone) {
        fail(
            'STUDENT_LEAD_MISSING',
            HttpStatusCode.BAD_REQUEST,
            'Tài khoản chưa gắn lead (users.lead_id). Liên hệ admin.',
        );
    }

    const supabase = createAdminClient();
    const { data: lead, error } = await supabase
        .from('leads')
        .select('id')
        .eq('phone_number', phone)
        .maybeSingle();

    throwIfSupabaseError(error, 'Không tìm được lead theo SĐT.');

    const foundId = (lead as { id?: number } | null)?.id;
    if (foundId == null) {
        fail(
            'STUDENT_LEAD_MISSING',
            HttpStatusCode.BAD_REQUEST,
            'Tài khoản chưa gắn lead (users.lead_id). Liên hệ admin.',
        );
    }

    const { error: updateError } = await supabase
        .from('users')
        .update({ lead_id: foundId } as never)
        .eq('id', userId);
    throwIfSupabaseError(updateError, 'Không cập nhật được users.lead_id.');

    return foundId;
}

export async function verifyQrCodeAndMarkAttendance(
    token: string,
    authUserId: string,
): Promise<VerifyQrResult> {
    const inflightKey = `${token}:${authUserId}`;
    const pending = verifyInflight.get(inflightKey);
    if (pending) {
        return pending;
    }

    const work = verifyQrCodeAndMarkAttendanceInner(token, authUserId).finally(() => {
        verifyInflight.delete(inflightKey);
    });
    verifyInflight.set(inflightKey, work);
    return work;
}

async function verifyQrCodeAndMarkAttendanceInner(
    token: string,
    authUserId: string,
): Promise<VerifyQrResult> {
    const supabase = createAdminClient();

    const { data: session, error: sessionError } = await supabase
        .from('class_sessions')
        .select('id, class_id, date, qr_code_token, qr_code_expires_at')
        .eq('qr_code_token', token)
        .maybeSingle();

    throwIfSupabaseError(sessionError, 'Không đọc được buổi học.');
    if (!session) {
        fail('QR_INVALID', HttpStatusCode.NOT_FOUND, 'Mã QR không hợp lệ hoặc đã hết hạn.');
    }

    const sessionData = session as {
        id: string;
        class_id: string;
        date: string;
        qr_code_expires_at: string | null;
    };

    if (sessionData.qr_code_expires_at && new Date(sessionData.qr_code_expires_at) < new Date()) {
        fail(
            'QR_EXPIRED',
            HttpStatusCode.BAD_REQUEST,
            'Mã QR đã hết hạn. Vui lòng nhờ giáo viên tạo mã mới.',
        );
    }

    // session_attendances.student_id → users.id
    // users.lead_id → class_students.student_id
    const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('id, lead_id, phone')
        .eq('id', authUserId)
        .maybeSingle();

    throwIfSupabaseError(userError, 'Không đọc được tài khoản.');
    if (!userRow) {
        fail(
            'STUDENT_INVALID',
            HttpStatusCode.UNAUTHORIZED,
            'Tài khoản học viên không hợp lệ. Vui lòng đăng nhập lại.',
        );
    }

    const user = userRow as { id: string; lead_id: number | null; phone: string | null };
    const leadId = await resolveStudentLeadId(user.id, user.lead_id, user.phone);

    const { data: enrollment, error: enrollError } = await supabase
        .from('class_students')
        .select('id')
        .eq('class_id', sessionData.class_id)
        .eq('student_id', leadId)
        .maybeSingle();

    throwIfSupabaseError(enrollError, 'Không kiểm tra được lớp học.');
    if (!enrollment) {
        fail('NOT_ENROLLED', HttpStatusCode.FORBIDDEN, 'Bạn không thuộc lớp của buổi học này.');
    }

    const attendance = await saveAttendanceRecord(sessionData.id, user.id, 'present', null);
    return {
        ...attendance,
        class_id: sessionData.class_id,
        session_date: sessionData.date,
    };
}

// ─── Attendances ─────────────────────────────────────────────────────────

async function saveAttendanceRecord(
    sessionId: string,
    studentId: string,
    status: AttendanceStatus,
    notes?: string | null,
): Promise<SessionAttendance> {
    const supabase = createAdminClient();
    const payload = {
        session_id: sessionId,
        student_id: studentId,
        status,
        notes: notes ?? null,
    };

    // No unique(session_id, student_id) in DB — select then update/insert; prune dupes
    const { data: existingRows, error: findError } = await supabase
        .from('session_attendances')
        .select('*')
        .eq('session_id', sessionId)
        .eq('student_id', studentId)
        .order('created_at', { ascending: true });

    throwIfSupabaseError(findError);

    const rows = (existingRows as Array<{ id: string }> | null) ?? [];
    if (rows.length > 0) {
        const [keep, ...dupes] = rows;
        if (dupes.length > 0) {
            const { error: deleteError } = await supabase
                .from('session_attendances')
                .delete()
                .in(
                    'id',
                    dupes.map((d) => d.id),
                );
            throwIfSupabaseError(deleteError, 'Không xoá được bản ghi điểm danh trùng.');
        }

        const { data, error } = await supabase
            .from('session_attendances')
            .update({
                status,
                notes: notes ?? null,
                updated_at: new Date().toISOString(),
            } as never)
            .eq('id', keep.id)
            .select('*')
            .maybeSingle();

        throwIfSupabaseError(error);
        return (data ?? keep) as unknown as SessionAttendance;
    }

    const { data, error } = await supabase
        .from('session_attendances')
        .insert(payload as never)
        .select('*')
        .maybeSingle();

    throwIfSupabaseError(error);
    if (!data) {
        fail(
            'ATTENDANCE_CREATE_FAILED',
            HttpStatusCode.INTERNAL_SERVER_ERROR,
            'Không thể tạo bản ghi điểm danh.',
        );
    }

    return data as unknown as SessionAttendance;
}

export async function getSessionAttendances(sessionId: string): Promise<SessionAttendance[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('session_attendances')
        .select(ATTENDANCE_SELECT)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

    throwIfSupabaseError(error);
    return (data as unknown as SessionAttendance[]) || [];
}

export async function upsertAttendance(
    sessionId: string,
    studentId: string,
    status: AttendanceStatus,
    notes?: string | null,
): Promise<SessionAttendance> {
    return saveAttendanceRecord(sessionId, studentId, status, notes);
}

export async function bulkUpsertAttendances(
    sessionId: string,
    records: { student_id: string; status: AttendanceStatus; notes?: string | null }[],
): Promise<SessionAttendance[]> {
    const results: SessionAttendance[] = [];
    for (const record of records) {
        results.push(
            await saveAttendanceRecord(
                sessionId,
                record.student_id,
                record.status,
                record.notes ?? null,
            ),
        );
    }
    return results;
}
