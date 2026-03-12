import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Class } from '@/lib/services/class.service';
import type { CreateClassInput, UpdateClassInput } from '@/lib/validators/class.validator';
import { fetchJson } from '@/lib/utils/fetchJson';

export const CLASS_QUERY_KEY = 'classes';

async function fetchClasses(): Promise<Class[]> {
    return fetchJson<Class[]>('/api/classes');
}

async function createClass(data: CreateClassInput): Promise<Class> {
    return fetchJson<Class>('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

async function getClass(id: string): Promise<Class> {
    return fetchJson<Class>(`/api/classes/${id}`);
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

async function updateClassRequest({ id, data }: { id: string; data: UpdateClassInput }): Promise<Class> {
    return fetchJson<Class>(`/api/classes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
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
    await fetchJson<void>(`/api/classes/${id}`, { method: 'DELETE' });
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
    return fetchJson<any[]>(`/api/classes/${classId}/students`);
}

export function useClassStudents(classId: string) {
    return useQuery({
        queryKey: [CLASS_STUDENT_QUERY_KEY, classId],
        queryFn: () => fetchClassStudents(classId),
        enabled: !!classId,
    });
}

async function addClassStudentReq({ classId, studentId }: { classId: string; studentId: number }) {
    return fetchJson(`/api/classes/${classId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId }),
    });
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
    await fetchJson<void>(`/api/classes/students/${studentId}`, { method: 'DELETE' });
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

async function updateClassStudentReq({ studentId, data }: { studentId: string; data: Partial<any> }) {
    return fetchJson(`/api/classes/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export function useUpdateClassStudent(classId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateClassStudentReq,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [CLASS_STUDENT_QUERY_KEY, classId] });
            queryClient.invalidateQueries({ queryKey: [CLASS_QUERY_KEY] });
        },
    });
}

