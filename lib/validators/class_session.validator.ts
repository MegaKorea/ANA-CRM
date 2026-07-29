import { AppError } from '@/errors';
import { HttpStatusCode } from '@/constants/enums';

const VALID_ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'excused', 'not_arrived'] as const;

// ─── Session Validators ──────────────────────────────────────────────────

export interface UpdateSessionInput {
    teacher_id?: string | null;
    content?: string | null;
    date?: string;
    room?: string | null;
}

export function validateUpdateSessionInput(input: unknown): UpdateSessionInput {
    if (!input || typeof input !== 'object') {
        throw new AppError('INVALID_INPUT', HttpStatusCode.BAD_REQUEST);
    }

    const data = input as Record<string, unknown>;
    const result: UpdateSessionInput = {};

    if (data.teacher_id !== undefined) {
        result.teacher_id = typeof data.teacher_id === 'string' ? data.teacher_id.trim() || null : null;
    }

    if (data.content !== undefined) {
        result.content = typeof data.content === 'string' ? data.content.trim() || null : null;
    }

    if (data.date !== undefined) {
        if (typeof data.date !== 'string' || !data.date.trim()) {
            throw new AppError('INVALID_DATE', HttpStatusCode.BAD_REQUEST);
        }
        result.date = data.date.trim();
    }

    if (data.room !== undefined) {
        result.room = typeof data.room === 'string' ? data.room.trim() || null : null;
    }

    return result;
}


// ─── Generate Sessions Validators ────────────────────────────────────────

export interface GenerateSessionsInput {
    start_date: string;
    end_date: string;
    schedule?: string | null;
}

export function validateGenerateSessionsInput(input: unknown): GenerateSessionsInput {
    if (!input || typeof input !== 'object') {
        throw new AppError('INVALID_INPUT', HttpStatusCode.BAD_REQUEST);
    }

    const data = input as Record<string, unknown>;

    if (typeof data.start_date !== 'string' || !data.start_date.trim()) {
        throw new AppError('START_DATE_REQUIRED', HttpStatusCode.BAD_REQUEST);
    }

    if (typeof data.end_date !== 'string' || !data.end_date.trim()) {
        throw new AppError('END_DATE_REQUIRED', HttpStatusCode.BAD_REQUEST);
    }

    return {
        start_date: data.start_date.trim(),
        end_date: data.end_date.trim(),
        schedule: typeof data.schedule === 'string' ? data.schedule.trim() : null,
    };
}

// ─── Attendance Validators ───────────────────────────────────────────────

export interface UpsertAttendanceInput {
    /** `leads.id` — client gửi lên dạng số hoặc chuỗi số, chuẩn hoá về number. */
    student_id: number;
    status: typeof VALID_ATTENDANCE_STATUSES[number];
    notes?: string | null;
}

export function validateUpsertAttendanceInput(input: unknown): UpsertAttendanceInput {
    if (!input || typeof input !== 'object') {
        throw new AppError('INVALID_INPUT', HttpStatusCode.BAD_REQUEST);
    }

    const data = input as Record<string, unknown>;

    // Khoá của object trong JS luôn là chuỗi, nên client thường gửi "6" thay vì 6.
    const studentId =
        typeof data.student_id === 'number' ? data.student_id : Number(data.student_id);

    if (!Number.isInteger(studentId) || studentId <= 0) {
        throw new AppError('STUDENT_ID_REQUIRED', HttpStatusCode.BAD_REQUEST);
    }

    if (!VALID_ATTENDANCE_STATUSES.includes(data.status as any)) {
        throw new AppError('INVALID_ATTENDANCE_STATUS', HttpStatusCode.BAD_REQUEST);
    }

    return {
        student_id: studentId,
        status: data.status as typeof VALID_ATTENDANCE_STATUSES[number],
        notes: typeof data.notes === 'string' ? data.notes.trim() || null : null,
    };
}

// ─── Bulk Attendance Validator ───────────────────────────────────────────

export interface BulkAttendanceInput {
    records: UpsertAttendanceInput[];
}

export function validateBulkAttendanceInput(input: unknown): BulkAttendanceInput {
    if (!input || typeof input !== 'object') {
        throw new AppError('INVALID_INPUT', HttpStatusCode.BAD_REQUEST);
    }

    const data = input as Record<string, unknown>;

    if (!Array.isArray(data.records) || data.records.length === 0) {
        throw new AppError('RECORDS_REQUIRED', HttpStatusCode.BAD_REQUEST);
    }

    const records = data.records.map((record: unknown) => validateUpsertAttendanceInput(record));

    return { records };
}

// ─── QR Code Verify Validator ────────────────────────────────────────────

export interface VerifyQrInput {
    token: string;
}

export function validateVerifyQrInput(input: unknown): VerifyQrInput {
    if (!input || typeof input !== 'object') {
        throw new AppError('INVALID_INPUT', HttpStatusCode.BAD_REQUEST);
    }

    const data = input as Record<string, unknown>;

    if (typeof data.token !== 'string' || !data.token.trim()) {
        throw new AppError('TOKEN_REQUIRED', HttpStatusCode.BAD_REQUEST);
    }

    return { token: data.token.trim() };
}
