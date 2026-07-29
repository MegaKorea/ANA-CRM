import { createAdminClient } from '@/lib/supabase/admin';
import type { CreateCourseInput, UpdateCourseInput } from '@/lib/validators/course.validator';
import { CoursesTable } from '../supabase/types/tables/courses';

export type Course = CoursesTable['Row'];

export async function fetchAllCourses(studentPhone?: string): Promise<Course[]> {
    const supabase = createAdminClient();

    let query = supabase.from('courses').select('*').order('created_at', { ascending: false });

    // STU: chỉ khóa gắn với lớp đang học; chưa có lớp → []
    if (studentPhone) {
        const { data: leadData } = await supabase
            .from('leads')
            .select('id')
            .eq('phone_number', studentPhone)
            .maybeSingle();

        if (!leadData) {
            return [];
        }

        const { data: classStudentsData } = await supabase
            .from('class_students')
            .select('class_id')
            .eq('student_id', (leadData as { id: number }).id);

        const enrolledClassIds =
            classStudentsData?.map((cs: { class_id: string }) => cs.class_id) || [];

        if (enrolledClassIds.length === 0) {
            return [];
        }

        const { data: classesData, error: classesError } = await supabase
            .from('classes')
            .select('course_id')
            .in('id', enrolledClassIds);

        if (classesError) {
            throw new Error(classesError.message);
        }

        const courseIds = [
            ...new Set(
                (classesData || [])
                    .map((c: { course_id: string | null }) => c.course_id)
                    .filter((id): id is string => Boolean(id)),
            ),
        ];

        if (courseIds.length === 0) {
            return [];
        }

        query = query.in('id', courseIds);
    }

    const { data, error } = await query;

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
