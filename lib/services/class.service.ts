import { createAdminClient } from '@/lib/supabase/admin';
import type { CreateClassInput, UpdateClassInput } from '@/lib/validators/class.validator';

export interface Class {
    id: string;
    course_id: string;
    code: string | null;
    name: string;
    start_date: string | null;
    end_date: string | null;
    schedule: string | null;
    timetable: 'Sáng' | 'Chiều' | 'Tối' | null;
    capacity: number | null;
    status: string | null;
    homeroom_teacher_id: string | null;
    created_at: string;
    updated_at: string;
    courses?: {
        name: string;
        code: string;
        fee: number;
    };
    teacher?: {
        id: string;
        full_name: string;
        email: string;
        phone: string | null;
    };
    class_students?: { id: string }[];
}

export async function fetchAllClasses(studentPhone?: string): Promise<Class[]> {
    const supabase = createAdminClient();

    let query = supabase
        .from('classes')
        .select(`
            *,
            courses (
                name,
                code,
                fee
            ),
            class_students (
                id
            ),
            teacher:users!classes_teacher_id_fkey(
                id,
                full_name,
                email,
                phone
            )
        `)
        .order('created_at', { ascending: false });

    if (studentPhone) {
        const { data: leadData } = await supabase
            .from('leads')
            .select('id')
            .eq('phone_number', studentPhone)
            .maybeSingle();

        if (leadData) {
            const { data: classStudentsData } = await supabase
                .from('class_students')
                .select('class_id')
                .eq('student_id', (leadData as any).id);

            const enrolledClassIds = classStudentsData?.map((cs: any) => cs.class_id) || [];

            if (enrolledClassIds.length > 0) {
                query = query.in('id', enrolledClassIds);
            } else {

                return [];
            }
        } else {
            return [];
        }
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(error.message);
    }

    return (data as unknown as Class[]) || [];
}

export async function getClass(id: string): Promise<Class> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('classes')
        .select(`
            *,
            courses (
                name,
                code,
                fee
            ),
            teacher:users!classes_teacher_id_fkey(
                id,
                full_name,
                email,
                phone
            )
        `)
        .eq('id', id)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data as unknown as Class;
}

export async function createClass(input: CreateClassInput): Promise<Class> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('classes')
        .insert(input as never)
        .select(`
            *,
            courses (
                name,
                code,
                fee
            ),
            teacher:users!classes_teacher_id_fkey(
                id,
                full_name,
                email,
                phone
            )
        `)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data as unknown as Class;
}

export async function updateClass(id: string, input: UpdateClassInput): Promise<Class> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('classes')
        .update(input as never)
        .eq('id', id)
        .select(`
            *,
            courses (
                name,
                code,
                fee
            ),
            teacher:users!classes_teacher_id_fkey(
                id,
                full_name,
                email,
                phone
            )
        `)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data as unknown as Class;
}

export async function deleteClass(id: string): Promise<void> {
    const supabase = createAdminClient();
    const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);

    if (error) {
        throw new Error(error.message);
    }
}
