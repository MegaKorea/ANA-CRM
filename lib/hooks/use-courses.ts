import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Course } from '@/lib/services/course.service';
import type { CreateCourseInput } from '@/lib/validators/course.validator';

export const COURSE_QUERY_KEY = 'courses';

async function fetchCourses(): Promise<Course[]> {
    const res = await fetch('/api/courses');
    if (!res.ok) {
        throw new Error('Failed to fetch courses');
    }
    return res.json();
}

async function createCourse(data: CreateCourseInput): Promise<Course> {
    const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        throw new Error('Failed to create course');
    }
    return res.json();
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
    const res = await fetch(`/api/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        throw new Error('Failed to update course');
    }
    return res.json();
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
    const res = await fetch(`/api/courses/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        throw new Error('Failed to delete course');
    }
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
