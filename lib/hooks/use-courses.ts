import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Course } from '@/lib/services/course.service';
import type { CreateCourseInput } from '@/lib/validators/course.validator';
import { fetchJson } from '@/lib/utils/fetchJson';

export const COURSE_QUERY_KEY = 'courses';

async function fetchCourses(): Promise<Course[]> {
    return fetchJson<Course[]>('/api/courses');
}

async function createCourse(data: CreateCourseInput): Promise<Course> {
    return fetchJson<Course>('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export function useCourses() {
    return useQuery({
        queryKey: [COURSE_QUERY_KEY],
        queryFn: fetchCourses,
    });
}

export function useCreateCourse() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createCourse,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [COURSE_QUERY_KEY] });
        },
    });
}

async function updateCourseRequest({ id, data }: { id: string; data: Partial<CreateCourseInput> }): Promise<Course> {
    return fetchJson<Course>(`/api/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export function useUpdateCourse() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateCourseRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [COURSE_QUERY_KEY] });
        },
    });
}

async function deleteCourseRequest(id: string): Promise<void> {
    await fetchJson<void>(`/api/courses/${id}`, { method: 'DELETE' });
}

export function useDeleteCourse() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteCourseRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [COURSE_QUERY_KEY] });
        },
    });
}
