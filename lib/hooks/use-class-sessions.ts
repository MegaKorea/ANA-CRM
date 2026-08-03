import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchJson } from '@/lib/utils/fetchJson';
import type { ClassSession, SessionAttendance, VerifyQrResult } from '@/lib/services/class_session.service';
import type { AttendanceStatus } from '@/lib/supabase/types/tables/session_attendances';
import { useUserRoleCode } from '@/lib/hooks/use-current-user';

// ─── Query Keys ──────────────────────────────────────────────────────────

export const CLASS_SESSIONS_KEY = 'class-sessions';
export const SESSION_ATTENDANCES_KEY = 'session-attendances';

// ─── Sessions ────────────────────────────────────────────────────────────

async function fetchClassSessions(classId: string): Promise<ClassSession[]> {
    return fetchJson<ClassSession[]>(`/api/classes/${classId}/sessions`);
}

/**
 * How often the schedule view re-checks the roster.
 *
 * This response carries `hasAttendance` / `attendanceMarkedCount`, which drive
 * the calendar dots and the "N học viên đã điểm danh" line in the day panel —
 * the surfaces a teacher actually watches while students scan. Those writes
 * happen on the students' own phones, so nothing invalidates this cache here.
 */
const SESSIONS_POLL_MS = 10_000;

export function useClassSessions(classId: string) {
    const roleCode = useUserRoleCode();
    return useQuery({
        // role trong key: STU nhận hasAttendance theo bản thân, staff theo cả buổi
        queryKey: [CLASS_SESSIONS_KEY, classId, roleCode ?? 'anon'],
        queryFn: () => fetchClassSessions(classId),
        enabled: !!classId,
        refetchOnWindowFocus: true,
        // Background polling stays off, so a hidden tab does not keep hitting the API.
        refetchInterval: classId ? SESSIONS_POLL_MS : false,
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

// ─── Attendances ─────────────────────────────────────────────────────────

async function fetchSessionAttendances(sessionId: string): Promise<SessionAttendance[]> {
    return fetchJson<SessionAttendance[]>(`/api/classes/sessions/${sessionId}/attendances`);
}

/** How often a teacher's open modal re-checks who has scanned in. */
const ATTENDANCE_POLL_MS = 5_000;

/**
 * Attendances for one session.
 *
 * Polls while a session is selected: students scan on their own phones, so the
 * teacher's browser gets no cache invalidation from that write and would
 * otherwise show the roster exactly as it was when the modal opened. Passing
 * `null` (no modal open) disables both the query and the polling.
 */
export function useSessionAttendances(sessionId: string | null) {
    return useQuery({
        queryKey: [SESSION_ATTENDANCES_KEY, sessionId],
        queryFn: () => fetchSessionAttendances(sessionId!),
        enabled: !!sessionId,
        // Background polling stays off, so a hidden tab does not keep hitting the API.
        refetchInterval: sessionId ? ATTENDANCE_POLL_MS : false,
        refetchOnWindowFocus: true,
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
