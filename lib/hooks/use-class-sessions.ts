import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchJson } from '@/lib/utils/fetchJson';
import { QR_ROTATE_INTERVAL_MS } from '@/constants/attendance';
import type {
    ClassSession,
    QrAttendanceResult,
    SessionAttendance,
} from '@/lib/services/class_session.service';
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

export const QR_TOKEN_KEY = 'qr-token';

/**
 * Mã QR đang hiển thị cho một buổi học.
 *
 * Dùng useQuery + refetchInterval thay vì tự quản interval: React Query lo việc
 * xoay mã, huỷ khi unmount và không để hai vòng lặp chồng nhau. Mã phải luôn
 * tươi nên tắt cache (staleTime/gcTime = 0).
 */
export function useQrCodeToken(sessionId: string | null, enabled: boolean) {
    return useQuery({
        queryKey: [QR_TOKEN_KEY, sessionId],
        queryFn: () => generateQrTokenReq(sessionId!),
        enabled: enabled && !!sessionId,
        refetchInterval: QR_ROTATE_INTERVAL_MS,
        refetchIntervalInBackground: true,
        refetchOnWindowFocus: false,
        staleTime: 0,
        gcTime: 0,
        retry: 1,
    });
}

// Revoke QR code token (khi giáo viên đóng cửa sổ mã)
async function revokeQrTokenReq(sessionId: string): Promise<void> {
    await fetchJson<{ success: boolean }>(`/api/classes/sessions/${sessionId}`, {
        method: 'DELETE',
    });
}

export function useRevokeQrToken(classId: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: revokeQrTokenReq,
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
    records: { student_id: number; status: AttendanceStatus; notes?: string | null }[];
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
async function verifyQrCodeReq(token: string): Promise<QrAttendanceResult> {
    return fetchJson<QrAttendanceResult>('/api/attendance/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
    });
}

export function useVerifyQrCode() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: verifyQrCodeReq,
        onSuccess: (result) => {
            // Bảng điểm danh của giáo viên phải thấy ngay học viên vừa quét.
            queryClient.invalidateQueries({
                queryKey: [SESSION_ATTENDANCES_KEY, result.session.id],
            });
        },
    });
}
