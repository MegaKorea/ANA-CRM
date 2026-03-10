import { AppError } from '@/errors';
import { HttpStatusCode } from '@/constants/enums';

export interface CreateClassInput {
    code?: string | null;
    name: string;
    course_id: string;
    capacity?: number | null;
    status?: 'planned' | 'enrolling' | 'in_progress' | 'completed' | 'cancelled';
    start_date?: string | null;
    end_date?: string | null;
    schedule?: string | null;
}

export function validateCreateClassInput(input: unknown): CreateClassInput {
    if (!input || typeof input !== 'object') {
        throw new AppError('INVALID_INPUT', HttpStatusCode.BAD_REQUEST);
    }

    const data = input as Record<string, unknown>;

    if (typeof data.name !== 'string' || !data.name.trim()) {
        throw new AppError('NAME_REQUIRED', HttpStatusCode.BAD_REQUEST);
    }

    if (typeof data.course_id !== 'string' || !data.course_id.trim()) {
        throw new AppError('COURSE_ID_REQUIRED', HttpStatusCode.BAD_REQUEST);
    }

    return {
        code: typeof data.code === 'string' ? data.code.trim() : null,
        name: data.name.trim(),
        course_id: data.course_id.trim(),
        capacity: typeof data.capacity === 'number' ? data.capacity : Number(data.capacity) || null,
        status: ['planned', 'enrolling', 'in_progress', 'completed', 'cancelled'].includes(data.status as string)
            ? (data.status as any)
            : 'planned',
        start_date: typeof data.start_date === 'string' ? data.start_date.trim() : null,
        end_date: typeof data.end_date === 'string' ? data.end_date.trim() : null,
        schedule: typeof data.schedule === 'string' ? data.schedule.trim() : null,
    };
}

export interface UpdateClassInput extends Partial<CreateClassInput> { }

export function validateUpdateClassInput(input: unknown): UpdateClassInput {
    if (!input || typeof input !== 'object') {
        throw new AppError('INVALID_INPUT', HttpStatusCode.BAD_REQUEST);
    }

    const data = input as Record<string, unknown>;
    const updateData: Partial<CreateClassInput> = {};

    if (data.name !== undefined) {
        if (typeof data.name !== 'string' || !data.name.trim()) {
            throw new AppError('NAME_REQUIRED', HttpStatusCode.BAD_REQUEST);
        }
        updateData.name = data.name.trim();
    }

    if (data.code !== undefined) {
        updateData.code = typeof data.code === 'string' ? data.code.trim() : null;
    }

    if (data.course_id !== undefined) {
        if (typeof data.course_id !== 'string' || !data.course_id.trim()) {
            throw new AppError('COURSE_ID_REQUIRED', HttpStatusCode.BAD_REQUEST);
        }
        updateData.course_id = data.course_id.trim();
    }

    if (data.capacity !== undefined) {
        updateData.capacity = typeof data.capacity === 'number' ? data.capacity : Number(data.capacity) || null;
    }

    if (data.status !== undefined) {
        updateData.status = ['planned', 'enrolling', 'in_progress', 'completed', 'cancelled'].includes(data.status as string)
            ? (data.status as any)
            : 'planned';
    }

    if (data.start_date !== undefined) {
        updateData.start_date = typeof data.start_date === 'string' ? data.start_date.trim() : null;
    }

    if (data.end_date !== undefined) {
        updateData.end_date = typeof data.end_date === 'string' ? data.end_date.trim() : null;
    }

    if (data.schedule !== undefined) {
        updateData.schedule = typeof data.schedule === 'string' ? data.schedule.trim() : null;
    }

    return updateData;
}
