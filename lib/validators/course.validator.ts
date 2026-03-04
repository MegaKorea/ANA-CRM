import { AppError } from '@/errors';
import { HttpStatusCode } from '@/constants/enums';

export interface CreateCourseInput {
    code?: string | null;
    name: string;
    description?: string | null;
    level?: 'beginner' | 'intermediate' | 'advanced' | null;
    fee: number;
    expected_students?: number | null;
    expected_duration?: string | null;
    status?: 'active' | 'inactive';
}

export function validateCreateCourseInput(input: unknown): CreateCourseInput {
    if (!input || typeof input !== 'object') {
        throw new AppError('INVALID_INPUT', HttpStatusCode.BAD_REQUEST);
    }

    const data = input as Record<string, unknown>;

    if (typeof data.name !== 'string' || !data.name.trim()) {
        throw new AppError('NAME_REQUIRED', HttpStatusCode.BAD_REQUEST);
    }

    const fee = typeof data.fee === 'number' ? data.fee : Number(data.fee) || 0;

    return {
        code: typeof data.code === 'string' ? data.code : null,
        name: data.name.trim(),
        description: typeof data.description === 'string' ? data.description : null,
        level: ['beginner', 'intermediate', 'advanced'].includes(data.level as string) ? (data.level as any) : null,
        fee,
        expected_students: typeof data.expected_students === 'number' ? data.expected_students : null,
        expected_duration: typeof data.expected_duration === 'string' ? data.expected_duration : null,
        status: ['active', 'inactive'].includes(data.status as string) ? (data.status as any) : 'active',
    };
}

export interface UpdateCourseInput extends Partial<CreateCourseInput> { }

export function validateUpdateCourseInput(input: unknown): UpdateCourseInput {
    if (!input || typeof input !== 'object') {
        throw new AppError('INVALID_INPUT', HttpStatusCode.BAD_REQUEST);
    }

    const data = input as Record<string, unknown>;
    const updateData: Partial<CreateCourseInput> = {};

    if (data.name !== undefined) {
        if (typeof data.name !== 'string' || !data.name.trim()) {
            throw new AppError('NAME_REQUIRED', HttpStatusCode.BAD_REQUEST);
        }
        updateData.name = data.name.trim();
    }

    if (data.fee !== undefined) {
        updateData.fee = typeof data.fee === 'number' ? data.fee : Number(data.fee) || 0;
    }

    if (data.code !== undefined) {
        updateData.code = typeof data.code === 'string' ? data.code : null;
    }

    if (data.description !== undefined) {
        updateData.description = typeof data.description === 'string' ? data.description : null;
    }

    if (data.level !== undefined) {
        updateData.level = ['beginner', 'intermediate', 'advanced'].includes(data.level as string) ? (data.level as any) : null;
    }

    if (data.expected_students !== undefined) {
        updateData.expected_students = typeof data.expected_students === 'number' ? data.expected_students : null;
    }

    if (data.expected_duration !== undefined) {
        updateData.expected_duration = typeof data.expected_duration === 'string' ? data.expected_duration : null;
    }

    if (data.status !== undefined) {
        updateData.status = ['active', 'inactive'].includes(data.status as string) ? (data.status as any) : 'active';
    }

    return updateData;
}
