import { createAdminClient } from '@/lib/supabase/admin';
import type {
    AttendanceMethod,
    AttendanceStatus,
} from '@/lib/supabase/types/tables/session_attendances';
import { AppError } from '@/errors';
import { HttpStatusCode } from '@/constants/enums';
import { QR_TOKEN_TTL_MS } from '@/constants/attendance';

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
    /** `leads.id` — học viên của lớp là lead, xem class_students.student_id. */
    student_id: number;
    status: AttendanceStatus;
    notes: string | null;
    /** 'manual' = giáo viên đánh dấu, 'qr' = học viên tự quét. */
    method: AttendanceMethod;
    /** Thời điểm quét mã; null khi do giáo viên đánh dấu tay. */
    checked_in_at: string | null;
    checked_in_ip: string | null;
    checked_in_user_agent: string | null;
    created_at: string;
    updated_at: string;
    student?: {
        id: number;
        full_name: string;
        email: string | null;
        phone_number: string | null;
    } | null;
}

/** Kết quả điểm danh bằng QR — kèm thông tin buổi học để trang xác nhận hiển thị. */
export interface QrAttendanceResult {
    attendance: SessionAttendance;
    /** true khi buổi này đã có bản ghi trước đó — quét lại không ghi đè. */
    alreadyCheckedIn: boolean;
    session: {
        id: string;
        session_number: number;
        date: string;
        class_id: string;
        class_name: string | null;
        class_code: string | null;
    };
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

/**
 * Mã QR sống rất ngắn và được màn hình giáo viên xin lại liên tục.
 *
 * Đây là biện pháp chống gian lận chính: ảnh chụp màn hình mã QR gửi cho bạn bè
 * chỉ còn giá trị trong vài chục giây, nên muốn điểm danh vẫn phải có mặt trước
 * màn hình. Token cũ bị ghi đè ngay khi sinh mã mới nên tự động vô hiệu.
 */
export async function generateQrCodeToken(sessionId: string): Promise<{ token: string; expiresAt: string }> {
    const supabase = createAdminClient();
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + QR_TOKEN_TTL_MS).toISOString();

    const { error } = await supabase
        .from('class_sessions')
        .update({ qr_code_token: token, qr_code_expires_at: expiresAt } as never)
        .eq('id', sessionId);

    if (error) {
        throw new AppError('QR_GENERATE_FAILED', HttpStatusCode.INTERNAL_SERVER_ERROR, error.message);
    }

    return { token, expiresAt };
}

/**
 * Thu hồi mã khi giáo viên đóng cửa sổ QR, để không còn mã sống lơ lửng sau khi
 * buổi điểm danh kết thúc.
 */
export async function revokeQrCodeToken(sessionId: string): Promise<void> {
    const supabase = createAdminClient();

    const { error } = await supabase
        .from('class_sessions')
        .update({ qr_code_token: null, qr_code_expires_at: null } as never)
        .eq('id', sessionId);

    if (error) {
        throw new AppError('QR_REVOKE_FAILED', HttpStatusCode.INTERNAL_SERVER_ERROR, error.message);
    }
}

/**
 * Quy đổi tài khoản đăng nhập (`users.id`) sang học viên (`leads.id`).
 * Ưu tiên `users.lead_id`; nếu chưa có thì ghép qua số điện thoại — cách mà
 * `createStudentAccountIfNotExists` vẫn dùng để liên kết lead với tài khoản.
 */
async function resolveLeadIdForAuthUser(
    supabase: ReturnType<typeof createAdminClient>,
    authUserId: string
): Promise<number> {
    const { data: user } = await supabase
        .from('users')
        .select('lead_id, phone')
        .eq('id', authUserId)
        .maybeSingle();

    const userData = user as { lead_id: number | null; phone: string | null } | null;

    if (!userData) {
        throw new AppError(
            'ACCOUNT_NOT_FOUND',
            HttpStatusCode.BAD_REQUEST,
            'Không tìm thấy tài khoản của bạn trong hệ thống.'
        );
    }

    if (userData.lead_id) {
        return userData.lead_id;
    }

    if (!userData.phone) {
        throw new AppError(
            'STUDENT_PROFILE_NOT_LINKED',
            HttpStatusCode.BAD_REQUEST,
            'Tài khoản của bạn chưa được liên kết với hồ sơ học viên.'
        );
    }

    const { data: leads } = await supabase
        .from('leads')
        .select('id')
        .eq('phone_number', userData.phone)
        .limit(2);

    const matched = (leads ?? []) as { id: number }[];

    if (matched.length === 0) {
        throw new AppError(
            'STUDENT_PROFILE_NOT_LINKED',
            HttpStatusCode.BAD_REQUEST,
            'Tài khoản của bạn chưa được liên kết với hồ sơ học viên.'
        );
    }

    // Nhiều lead trùng số điện thoại thì không thể xác định chắc chắn là ai.
    if (matched.length > 1) {
        throw new AppError(
            'STUDENT_PROFILE_AMBIGUOUS',
            HttpStatusCode.CONFLICT,
            'Có nhiều hồ sơ học viên trùng số điện thoại. Vui lòng liên hệ giáo vụ.'
        );
    }

    return matched[0].id;
}

/**
 * Ngày hôm nay theo giờ Việt Nam, dạng `YYYY-MM-DD` để so trực tiếp với cột
 * `class_sessions.date`. Máy chủ triển khai thường chạy UTC, nếu lấy ngày theo
 * giờ máy thì từ 00:00 đến 07:00 giờ VN sẽ tính nhầm sang ngày hôm trước.
 */
function getTodayInVietnam(): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date());
}

function formatVietnameseDate(isoDate: string): string {
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
}

async function buildQrResult(
    supabase: ReturnType<typeof createAdminClient>,
    sessionData: { id: string; class_id: string; session_number: number; date: string },
    attendance: SessionAttendance,
    alreadyCheckedIn: boolean
): Promise<QrAttendanceResult> {
    const { data: classRow } = await supabase
        .from('classes')
        .select('name, code')
        .eq('id', sessionData.class_id)
        .maybeSingle();

    const classData = classRow as { name: string; code: string | null } | null;

    return {
        attendance,
        alreadyCheckedIn,
        session: {
            id: sessionData.id,
            session_number: sessionData.session_number,
            date: sessionData.date,
            class_id: sessionData.class_id,
            class_name: classData?.name ?? null,
            class_code: classData?.code ?? null,
        },
    };
}

export interface QrCheckInContext {
    /** Chỉ để lưu vết đối chiếu, không dùng để chặn — xem migration audit. */
    ip?: string | null;
    userAgent?: string | null;
}

export async function verifyQrCodeAndMarkAttendance(
    token: string,
    authUserId: string,
    context: QrCheckInContext = {}
): Promise<QrAttendanceResult> {
    const supabase = createAdminClient();

    // Find session by token
    const { data: session, error: sessionError } = await supabase
        .from('class_sessions')
        .select('id, class_id, session_number, date, qr_code_token, qr_code_expires_at')
        .eq('qr_code_token', token)
        .maybeSingle();

    if (sessionError || !session) {
        throw new AppError(
            'QR_INVALID',
            HttpStatusCode.BAD_REQUEST,
            'Mã QR không hợp lệ hoặc đã được thay bằng mã mới. Vui lòng quét lại mã đang hiển thị.'
        );
    }

    const sessionData = session as {
        id: string;
        class_id: string;
        session_number: number;
        date: string;
        qr_code_expires_at: string | null;
    };

    if (!sessionData.qr_code_expires_at || new Date(sessionData.qr_code_expires_at) < new Date()) {
        throw new AppError(
            'QR_EXPIRED',
            HttpStatusCode.BAD_REQUEST,
            'Mã QR đã hết hạn. Vui lòng quét lại mã đang hiển thị trên màn hình giáo viên.'
        );
    }

    // Buổi học phải diễn ra hôm nay. Chặn trường hợp giữ lại mã cũ để điểm danh
    // bù cho buổi đã qua, hoặc điểm danh trước cho buổi chưa tới.
    if (sessionData.date !== getTodayInVietnam()) {
        throw new AppError(
            'SESSION_NOT_TODAY',
            HttpStatusCode.BAD_REQUEST,
            `Buổi học này diễn ra ngày ${formatVietnameseDate(sessionData.date)}, không phải hôm nay.`
        );
    }

    const studentId = await resolveLeadIdForAuthUser(supabase, authUserId);

    // Mã QR có thể bị chụp lại và gửi cho người ngoài, nên vẫn phải kiểm tra
    // người quét có thuộc lớp của buổi học này không.
    const { data: enrollment } = await supabase
        .from('class_students')
        .select('id, status')
        .eq('class_id', sessionData.class_id)
        .eq('student_id', studentId)
        .maybeSingle();

    const enrollmentData = enrollment as { id: string; status: string | null } | null;

    if (!enrollmentData) {
        throw new AppError(
            'NOT_ENROLLED',
            HttpStatusCode.FORBIDDEN,
            'Bạn không thuộc lớp học của buổi này.'
        );
    }

    if (enrollmentData.status && enrollmentData.status !== 'active') {
        throw new AppError(
            'ENROLLMENT_INACTIVE',
            HttpStatusCode.FORBIDDEN,
            'Hồ sơ ghi danh của bạn ở lớp này không còn hiệu lực. Vui lòng liên hệ giáo vụ.'
        );
    }

    // Đã có bản ghi rồi thì không đè lên. Hai lý do:
    //  - Quét lại lần nữa phải là thao tác vô hại, không phải lỗi.
    //  - Trạng thái do giáo viên đặt (vắng có phép, đi trễ, ...) là quyết định của
    //    giáo viên, học viên không được tự ghi đè bằng cách quét mã.
    const { data: existing } = await supabase
        .from('session_attendances')
        .select('*')
        .eq('session_id', sessionData.id)
        .eq('student_id', studentId)
        .maybeSingle();

    const existingAttendance = existing as SessionAttendance | null;

    if (existingAttendance && existingAttendance.status !== 'not_arrived') {
        return buildQrResult(supabase, sessionData, existingAttendance, true);
    }

    const { data, error } = await supabase
        .from('session_attendances')
        .upsert(
            {
                session_id: sessionData.id,
                student_id: studentId,
                status: 'present',
                method: 'qr',
                checked_in_at: new Date().toISOString(),
                checked_in_ip: context.ip ?? null,
                checked_in_user_agent: context.userAgent?.slice(0, 500) ?? null,
            } as never,
            { onConflict: 'session_id,student_id' }
        )
        .select('*')
        .single();

    if (error) {
        throw new AppError('ATTENDANCE_SAVE_FAILED', HttpStatusCode.INTERNAL_SERVER_ERROR, error.message);
    }

    return buildQrResult(supabase, sessionData, data as unknown as SessionAttendance, false);
}

// ─── Attendances CRUD ────────────────────────────────────────────────────

const ATTENDANCE_SELECT = `
    *,
    student:leads!session_attendances_student_id_fkey(
        id,
        full_name,
        email,
        phone_number
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
    studentId: number,
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
    records: { student_id: number; status: AttendanceStatus; notes?: string | null }[]
): Promise<SessionAttendance[]> {
    const supabase = createAdminClient();
    // Giáo viên chỉnh tay thì ghi đè cả những dòng do QR tạo — quyết định của
    // giáo viên là quyết định cuối, nên method quay về 'manual' và xoá dấu vết
    // quét để bảng không hiển thị nhầm là học viên tự điểm danh.
    const rows = records.map((r) => ({
        session_id: sessionId,
        student_id: r.student_id,
        status: r.status,
        notes: r.notes ?? null,
        method: 'manual',
        checked_in_at: null,
        checked_in_ip: null,
        checked_in_user_agent: null,
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
