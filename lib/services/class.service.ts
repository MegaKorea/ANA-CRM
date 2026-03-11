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
    capacity: number | null;
    status: string | null;
    teacher_id: string | null;
    created_at: string;
    updated_at: string;
    courses?: {
        name: string;
        code: string;
    };
    class_students?: { id: string }[];
}

export async function fetchAllClasses(): Promise<Class[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('classes')
        .select(`
            *,
            courses (
                name,
                code
            ),
            class_students (
                id
            )
        `)
        .order('created_at', { ascending: false });

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
                code
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
                code
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
                code
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
