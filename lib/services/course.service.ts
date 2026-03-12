import { createAdminClient } from '@/lib/supabase/admin';
import type { CreateCourseInput, UpdateCourseInput } from '@/lib/validators/course.validator';
import { CoursesTable } from '../supabase/types/tables/courses';

export type Course = CoursesTable['Row'];

export async function fetchAllCourses(): Promise<Course[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('courses').select('*').order('created_at', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return (data as unknown as Course[]) || [];
}

export async function createCourse(input: CreateCourseInput): Promise<Course> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('courses')
        .insert(input as any)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data as unknown as Course;
}

export async function updateCourse(id: string, input: UpdateCourseInput): Promise<Course> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('courses')
        .update(input as never)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data as unknown as Course;
}

export async function deleteCourse(id: string): Promise<void> {
    const supabase = createAdminClient();
    const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

    if (error) {
        throw new Error(error.message);
    }
}
