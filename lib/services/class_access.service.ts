import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { fail, throwIfSupabaseError } from '@/errors';
import { HttpStatusCode } from '@/constants/enums';
import type { CurrentUser } from '@/lib/services/auth.service';

export type ClassViewer =
    | { kind: 'staff' }
    | { kind: 'student'; userId: string };

/**
 * Resolve the current requester for class detail APIs.
 * Students must be enrolled in the class; staff pass through.
 */
export async function resolveClassViewer(classId: string): Promise<ClassViewer> {
    const supabase = await createClient();
    const {
        data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
        fail('UNAUTHORIZED', HttpStatusCode.UNAUTHORIZED, 'Unauthorized');
    }

    const admin = createAdminClient();
    const { data: profile, error } = await admin
        .from('users')
        .select('id, lead_id, phone, roles(code)')
        .eq('id', authUser.id)
        .maybeSingle();

    throwIfSupabaseError(error, 'Không đọc được tài khoản.');

    const roleCode = (profile as { roles?: { code?: string } | null } | null)?.roles?.code;
    const metaRole = authUser.user_metadata?.role as string | undefined;
    // Align with middleware: STU from DB role or auth metadata
    const isStudent = roleCode === 'STU' || metaRole === 'STU';
    if (!isStudent) {
        return { kind: 'staff' };
    }

    const user = (profile ?? { lead_id: null, phone: null }) as {
        lead_id: number | null;
        phone: string | null;
    };
    await assertStudentEnrolledInClass(classId, user.lead_id, user.phone);
    return { kind: 'student', userId: authUser.id };
}

/**
 * Fast path when `getCurrentUser()` already ran in the same request.
 * Skips a second auth.getUser + users/roles round-trip.
 */
export async function assertClassAccess(
    classId: string,
    user: Pick<CurrentUser, 'id' | 'roleCode' | 'leadId' | 'phone'>,
): Promise<void> {
    const role = user.roleCode?.trim().toUpperCase();
    if (role !== 'STU') {
        return;
    }
    await assertStudentEnrolledInClass(classId, user.leadId, user.phone);
}

/** Read-only enrollment check (no users.lead_id backfill). */
export async function assertStudentEnrolledInClass(
    classId: string,
    leadId: number | null,
    phone: string | null,
): Promise<void> {
    const resolvedLeadId = await resolveLeadIdReadOnly(leadId, phone);
    if (resolvedLeadId == null) {
        fail(
            'STUDENT_LEAD_MISSING',
            HttpStatusCode.FORBIDDEN,
            'Tài khoản chưa gắn lead. Liên hệ admin.',
        );
    }

    const supabase = createAdminClient();
    const { data: enrollment, error } = await supabase
        .from('class_students')
        .select('id')
        .eq('class_id', classId)
        .eq('student_id', resolvedLeadId)
        .maybeSingle();

    throwIfSupabaseError(error, 'Không kiểm tra được lớp học.');
    if (!enrollment) {
        fail('NOT_ENROLLED', HttpStatusCode.FORBIDDEN, 'Bạn không thuộc lớp học này.');
    }
}

async function resolveLeadIdReadOnly(
    leadId: number | null,
    phone: string | null,
): Promise<number | null> {
    if (leadId != null) return leadId;
    if (!phone) return null;

    const supabase = createAdminClient();
    const { data: lead, error } = await supabase
        .from('leads')
        .select('id')
        .eq('phone_number', phone)
        .maybeSingle();

    throwIfSupabaseError(error, 'Không tìm được lead theo SĐT.');
    return (lead as { id?: number } | null)?.id ?? null;
}
