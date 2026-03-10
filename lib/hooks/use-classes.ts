import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Class } from '@/lib/services/class.service';
import type { CreateClassInput } from '@/lib/validators/class.validator';

export const CLASS_QUERY_KEY = 'classes';

async function fetchClasses(): Promise<Class[]> {
    const res = await fetch('/api/classes');
    if (!res.ok) {
        throw new Error('Failed to fetch classes');
    }
    return res.json();
}

async function createClass(data: CreateClassInput): Promise<Class> {
    const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        throw new Error('Failed to create class');
    }
    return res.json();
}

async function getClass(id: string): Promise<Class> {
    const res = await fetch(`/api/classes/${id}`);
    if (!res.ok) {
        throw new Error('Failed to fetch class');
    }
    return res.json();
}

export function useClass(id: string) {
    return useQuery({
        queryKey: [CLASS_QUERY_KEY, id],
        queryFn: () => getClass(id),
        enabled: !!id,
    });
}

export function useClasses() {
    return useQuery({
        queryKey: [CLASS_QUERY_KEY],
        queryFn: fetchClasses,
    });
}

export function useCreateClass() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createClass,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [CLASS_QUERY_KEY] });
        },
    });
}

async function updateClassRequest({ id, data }: { id: string; data: Partial<CreateClassInput> }): Promise<Class> {
    const res = await fetch(`/api/classes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        throw new Error('Failed to update class');
    }
    return res.json();
}

export function useUpdateClass() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateClassRequest,
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: [CLASS_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [CLASS_QUERY_KEY, variables.id] });
        },
    });
}

async function deleteClassRequest(id: string): Promise<void> {
    const res = await fetch(`/api/classes/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        throw new Error('Failed to delete class');
    }
}

export function useDeleteClass() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteClassRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [CLASS_QUERY_KEY] });
        },
    });
}

export const CLASS_STUDENT_QUERY_KEY = 'class-students';

async function fetchClassStudents(classId: string) {
    const res = await fetch(`/api/classes/${classId}/students`);
    if (!res.ok) throw new Error('Failed to fetch class students');
    return res.json();
}

export function useClassStudents(classId: string) {
    return useQuery({
        queryKey: [CLASS_STUDENT_QUERY_KEY, classId],
        queryFn: () => fetchClassStudents(classId),
        enabled: !!classId,
    });
}

async function addClassStudentReq({ classId, studentId }: { classId: string; studentId: number }) {
    const res = await fetch(`/api/classes/${classId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add student to class');
    return data;
}

export function useAddClassStudent(classId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: addClassStudentReq,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [CLASS_STUDENT_QUERY_KEY, classId] });
            queryClient.invalidateQueries({ queryKey: [CLASS_QUERY_KEY] });
        },
    });
}

async function removeClassStudentReq(studentId: string) {
    const res = await fetch(`/api/classes/students/${studentId}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to remove student from class');
    }
}

export function useRemoveClassStudent(classId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: removeClassStudentReq,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [CLASS_STUDENT_QUERY_KEY, classId] });
            queryClient.invalidateQueries({ queryKey: [CLASS_QUERY_KEY] });
        },
    });
}
