import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchJson } from '@/lib/utils/fetchJson';
import type { ClassSession, SessionAttendance, VerifyQrResult } from '@/lib/services/class_session.service';
import type { AttendanceStatus } from '@/lib/supabase/types/tables/session_attendances';
import { useUserRoleCode } from '@/lib/hooks/use-current-user';
import type { SessionLecture, SessionLectureAttachment, SessionLectureLink } from '@/lib/types/session-lecture';

// ─── Query Keys ──────────────────────────────────────────────────────────

export const CLASS_SESSIONS_KEY = 'class-sessions';
export const SESSION_ATTENDANCES_KEY = 'session-attendances';
export const SESSION_LECTURES_KEY = 'session-lectures';

export type SessionLectureFormValues = {
  title: string;
  html?: string;
  links?: SessionLectureLink[];
  attachments?: SessionLectureAttachment[];
  status?: 'draft' | 'published';
};

// ─── Sessions ────────────────────────────────────────────────────────────

async function fetchClassSessions(classId: string): Promise<ClassSession[]> {
    return fetchJson<ClassSession[]>(`/api/classes/${classId}/sessions`);
}

export function useClassSessions(classId: string) {
    const roleCode = useUserRoleCode();
    return useQuery({
        queryKey: [CLASS_SESSIONS_KEY, classId, roleCode ?? 'anon'],
        queryFn: () => fetchClassSessions(classId),
        enabled: !!classId,
        refetchOnWindowFocus: true,
        staleTime: 15_000,
    });
}

// Generate sessions from date range
async function generateSessionsReq({
    classId,
    startDate,
    endDate,
    schedule,
}: {
    classId: string;
    startDate: string;
    endDate: string;
    schedule?: string | null;
}): Promise<ClassSession[]> {
    return fetchJson<ClassSession[]>(`/api/classes/${classId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            start_date: startDate,
            end_date: endDate,
            schedule,
        }),
    });
}

export function useGenerateSessions(classId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: generateSessionsReq,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [CLASS_SESSIONS_KEY, classId] });
        },
    });
}

// Update a single session (teacher, content, date, room)
async function updateSessionReq({
    sessionId,
    data,
}: {
    sessionId: string;
    data: { teacher_id?: string | null; content?: string | null; date?: string; room?: string | null };
}): Promise<ClassSession> {
    return fetchJson<ClassSession>(`/api/classes/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export function useUpdateSession(classId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateSessionReq,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [CLASS_SESSIONS_KEY, classId] });
        },
    });
}

// Generate QR code token
async function generateQrTokenReq(sessionId: string): Promise<{ token: string; expiresAt: string }> {
    return fetchJson<{ token: string; expiresAt: string }>(`/api/classes/sessions/${sessionId}`, {
        method: 'POST',
    });
}

export function useGenerateQrToken(classId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: generateQrTokenReq,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [CLASS_SESSIONS_KEY, classId] });
        },
    });
}

async function markSessionSeenReq({
    sessionId,
    kind,
}: {
    sessionId: string;
    kind: 'lecture' | 'quiz';
}): Promise<{ updated: number }> {
    return fetchJson<{ updated: number }>(`/api/classes/sessions/${sessionId}/seen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind }),
    });
}

export function useMarkSessionSeen(classId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: markSessionSeenReq,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [CLASS_SESSIONS_KEY, classId] });
        },
    });
}

// ─── Attendances ─────────────────────────────────────────────────────────

async function fetchSessionAttendances(sessionId: string): Promise<SessionAttendance[]> {
    return fetchJson<SessionAttendance[]>(`/api/classes/sessions/${sessionId}/attendances`);
}

export function useSessionAttendances(sessionId: string | null) {
    return useQuery({
        queryKey: [SESSION_ATTENDANCES_KEY, sessionId],
        queryFn: () => fetchSessionAttendances(sessionId!),
        enabled: !!sessionId,
    });
}

// Bulk upsert attendances
async function bulkUpsertAttendancesReq({
    sessionId,
    records,
}: {
    sessionId: string;
    records: { student_id: string; status: AttendanceStatus; notes?: string | null }[];
}): Promise<SessionAttendance[]> {
    return fetchJson<SessionAttendance[]>(`/api/classes/sessions/${sessionId}/attendances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
    });
}

export function useBulkUpsertAttendances(classId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: bulkUpsertAttendancesReq,
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: [SESSION_ATTENDANCES_KEY, variables.sessionId] });
            queryClient.invalidateQueries({ queryKey: [CLASS_SESSIONS_KEY, classId] });
        },
    });
}

// QR code verification (student-side)
async function verifyQrCodeReq(token: string): Promise<VerifyQrResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18_000);
    try {
        return await fetchJson<VerifyQrResult>('/api/attendance/qr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
            signal: controller.signal,
        });
    } catch (e: unknown) {
        if (e instanceof Error && e.name === 'AbortError') {
            throw new Error('Hết thời gian chờ phản hồi từ máy chủ.');
        }
        throw e;
    } finally {
        clearTimeout(timeoutId);
    }
}

export function useVerifyQrCode(classId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: verifyQrCodeReq,
        onSuccess: () => {
            if (classId) {
                queryClient.invalidateQueries({ queryKey: [CLASS_SESSIONS_KEY, classId] });
            } else {
                queryClient.invalidateQueries({ queryKey: [CLASS_SESSIONS_KEY] });
            }
            queryClient.invalidateQueries({ queryKey: [SESSION_ATTENDANCES_KEY] });
        },
    });
}

// ─── Session lectures ────────────────────────────────────────────────────

async function fetchSessionLectures(sessionId: string): Promise<SessionLecture[]> {
    return fetchJson<SessionLecture[]>(`/api/classes/sessions/${sessionId}/lectures`);
}

export function useSessionLectures(sessionId: string | null) {
    return useQuery({
        queryKey: [SESSION_LECTURES_KEY, sessionId],
        queryFn: () => fetchSessionLectures(sessionId!),
        enabled: !!sessionId,
    });
}

async function createSessionLectureReq({
    sessionId,
    data,
}: {
    sessionId: string;
    data: SessionLectureFormValues;
}): Promise<SessionLecture> {
    return fetchJson<SessionLecture>(`/api/classes/sessions/${sessionId}/lectures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export function useCreateSessionLecture(classId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createSessionLectureReq,
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: [SESSION_LECTURES_KEY, variables.sessionId] });
            queryClient.invalidateQueries({ queryKey: [CLASS_SESSIONS_KEY, classId] });
        },
    });
}

async function updateSessionLectureReq({
    sessionId,
    lectureId,
    data,
}: {
    sessionId: string;
    lectureId: string;
    data: Partial<SessionLectureFormValues>;
}): Promise<SessionLecture> {
    return fetchJson<SessionLecture>(`/api/classes/sessions/${sessionId}/lectures/${lectureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
}

export function useUpdateSessionLecture(classId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateSessionLectureReq,
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: [SESSION_LECTURES_KEY, variables.sessionId] });
            queryClient.invalidateQueries({ queryKey: [CLASS_SESSIONS_KEY, classId] });
        },
    });
}

async function deleteSessionLectureReq({
    sessionId,
    lectureId,
}: {
    sessionId: string;
    lectureId: string;
}): Promise<void> {
    await fetchJson<void>(`/api/classes/sessions/${sessionId}/lectures/${lectureId}`, {
        method: 'DELETE',
    });
}

export function useDeleteSessionLecture(classId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteSessionLectureReq,
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: [SESSION_LECTURES_KEY, variables.sessionId] });
            queryClient.invalidateQueries({ queryKey: [CLASS_SESSIONS_KEY, classId] });
        },
    });
}
