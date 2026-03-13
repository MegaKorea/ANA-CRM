import { createAdminClient } from '@/lib/supabase/admin';

export interface SubjectTeacher {
    id: string;
    class_id: string;
    teacher_id: string;
    subject: string | null;
    created_at: string;
    users?: {
        id: string;
        full_name: string;
    };
}

export async function fetchSubjectTeachersByClassId(classId: string): Promise<SubjectTeacher[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('subject_teachers')
        .select(`
            *,
            users (
                id,
                full_name
            )
        `)
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

    // Fallback: If fk_teacher doesn't work in the type mapping, maybe try just users
    // If it throws an error we'll fix later, but the FK name in DB is fk_teacher

    // Oh wait, supabase select uses relation table name or fk name. If fk is 'fk_teacher', 'users!fk_teacher(...)' is usually the way.
    // Let's use `users!fk_teacher(id, full_name)` or just `users(id, full_name)` since there is only one FK.
    // Actually, `users(id, full_name)` is the easiest if it's unambiguous.
    // But I will write it as safe as possible.

    if (error) {
        console.error('fetchSubjectTeachersByClassId error:', error);
        throw new Error(error.message);
    }

    return data as unknown as SubjectTeacher[];
}

export async function addSubjectTeacher(input: { class_id: string; teacher_id: string; subject?: string }): Promise<SubjectTeacher> {
    const supabase = createAdminClient();

    // Check for duplicate
    const { data: existing } = await supabase
        .from('subject_teachers')
        .select('id')
        .eq('class_id', input.class_id)
        .eq('teacher_id', input.teacher_id)
        .maybeSingle();

    if (existing) {
        throw new Error('Giáo viên này đã được phân công bộ môn cho lớp rồi');
    }

    const { data, error } = await supabase
        .from('subject_teachers')
        .insert(input as never)
        .select(`
        *,
        users(
            id,
            full_name
        )
            `)
        .single();

    if (error) {
        console.error('addSubjectTeacher error:', error);
        throw new Error(error.message);
    }

    return data as unknown as SubjectTeacher;
}

export async function removeSubjectTeacher(id: string): Promise<void> {
    const supabase = createAdminClient();
    const { error } = await supabase
        .from('subject_teachers')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('removeSubjectTeacher error:', error);
        throw new Error(error.message);
    }
}
