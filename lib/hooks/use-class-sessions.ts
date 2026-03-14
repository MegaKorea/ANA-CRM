import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchJson } from '@/lib/utils/fetchJson';
import type { ClassSession, SessionAttendance } from '@/lib/services/class_session.service';
import type { AttendanceStatus } from '@/lib/supabase/types/tables/session_attendances';

// ─── Query Keys ──────────────────────────────────────────────────────────

export const CLASS_SESSIONS_KEY = 'class-sessions';
export const SESSION_ATTENDANCES_KEY = 'session-attendances';

// ─── Sessions ────────────────────────────────────────────────────────────

async function fetchClassSessions(classId: string): Promise<ClassSession[]> {
    return fetchJson<ClassSession[]>(`/api/classes/${classId}/sessions`);
}

export function useClassSessions(classId: string) {
    return useQuery({
        queryKey: [CLASS_SESSIONS_KEY, classId],
        queryFn: () => fetchClassSessions(classId),
        enabled: !!classId,
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
async function verifyQrCodeReq(token: string): Promise<SessionAttendance> {
    return fetchJson<SessionAttendance>('/api/attendance/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
    });
}

export function useVerifyQrCode() {
    return useMutation({
        mutationFn: verifyQrCodeReq,
    });
}
