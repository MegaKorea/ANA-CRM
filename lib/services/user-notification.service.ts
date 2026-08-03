import { createAdminClient } from '@/lib/supabase/admin';
import { fail, throwIfSupabaseError } from '@/errors';
import {
  ClassMemberRole,
  HttpStatusCode,
  NotificationPayloadKind,
  UserNotificationErrorCode,
  UserNotificationLimit,
  UserNotificationType,
} from '@/constants/enums';
import type {
  LectureNotificationPayload,
  QuizNotificationPayload,
  UserNotification,
  UserNotificationPayload,
} from '@/lib/types/user-notification';

function mapNotification(row: Record<string, unknown>): UserNotification {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    type: row.type as string,
    title: (row.title as string) ?? '',
    body: (row.body as string) ?? '',
    payload:
      row.payload && typeof row.payload === 'object'
        ? (row.payload as UserNotificationPayload)
        : null,
    read_at: (row.read_at as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function listClassStudentUserIds(classId: string): Promise<string[]> {
  const supabase = createAdminClient();
  const { data: enrollments, error: enrollError } = await supabase
    .from('class_students')
    .select(
      `
      student_id,
      leads (
        phone_number
      )
    `,
    )
    .eq('class_id', classId);

  throwIfSupabaseError(enrollError, UserNotificationErrorCode.FETCH_FAILED);

  const rows =
    (enrollments as unknown as {
      student_id: number;
      leads?: { phone_number?: string | null } | null;
    }[]) || [];

  const leadIds = [...new Set(rows.map((row) => row.student_id).filter((id) => id != null))];
  const phoneNumbers = [
    ...new Set(
      rows
        .map((row) => row.leads?.phone_number?.trim())
        .filter((phone): phone is string => Boolean(phone)),
    ),
  ];

  if (leadIds.length === 0 && phoneNumbers.length === 0) return [];

  const orParts: string[] = [];
  if (leadIds.length > 0) orParts.push(`lead_id.in.(${leadIds.join(',')})`);
  if (phoneNumbers.length > 0) {
    const phones = phoneNumbers.map((phone) => `"${phone.replace(/"/g, '')}"`).join(',');
    orParts.push(`phone.in.(${phones})`);
  }

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, lead_id, phone, roles!inner(code)')
    .or(orParts.join(','))
    .eq('roles.code', ClassMemberRole.STU);

  throwIfSupabaseError(usersError, UserNotificationErrorCode.FETCH_FAILED);

  const userIds = new Set<string>();
  for (const user of (users as unknown as {
    id: string;
    lead_id: number | null;
    phone: string | null;
  }[]) || []) {
    userIds.add(user.id);
  }

  return [...userIds];
}

async function insertNotificationsForUsers(input: {
  userIds: string[];
  type: UserNotificationType;
  title: string;
  body: string;
  payload: UserNotificationPayload;
}): Promise<number> {
  if (input.userIds.length === 0) return 0;

  const now = new Date().toISOString();
  const rows = input.userIds.map((userId) => ({
    user_id: userId,
    type: input.type,
    title: input.title,
    body: input.body,
    payload: input.payload,
    read_at: null,
    created_at: now,
    updated_at: now,
  }));

  const supabase = createAdminClient();
  const { error } = await supabase.from('user_notifications').insert(rows as never);
  throwIfSupabaseError(error, UserNotificationErrorCode.CREATE_FAILED);
  return rows.length;
}

export async function notifyStudentsLectureCreated(input: {
  classId: string;
  sessionId: string;
  sessionDate: string;
  sessionNumber: number;
  lectureId: string;
  lectureTitle: string;
  html: string;
  links: LectureNotificationPayload['links'];
  attachments: LectureNotificationPayload['attachments'];
}): Promise<number> {
  const userIds = await listClassStudentUserIds(input.classId);
  const title = input.lectureTitle.trim() || 'Bài giảng mới';
  const html =
    input.html.length > UserNotificationLimit.PREVIEW_HTML_MAX
      ? `${input.html.slice(0, UserNotificationLimit.PREVIEW_HTML_MAX)}…`
      : input.html;

  const payload: LectureNotificationPayload = {
    kind: NotificationPayloadKind.LECTURE,
    class_id: input.classId,
    session_id: input.sessionId,
    session_date: input.sessionDate,
    session_number: input.sessionNumber,
    lecture_id: input.lectureId,
    lecture_title: title,
    html,
    links: input.links ?? [],
    attachments: input.attachments ?? [],
  };

  return insertNotificationsForUsers({
    userIds,
    type: UserNotificationType.LECTURE_CREATED,
    title: 'Có bài giảng mới',
    body: `Buổi ${input.sessionNumber}: ${title}`,
    payload,
  });
}

export async function notifyStudentsQuizPublished(input: {
  classId: string;
  sessionId: string;
  sessionDate: string;
  sessionNumber: number;
  quizId: string;
  quizTitle: string;
  questionCount: number;
  durationMinutes: number;
  passingScore: number;
}): Promise<number> {
  const userIds = await listClassStudentUserIds(input.classId);
  const title = input.quizTitle.trim() || 'Bài tập mới';
  const payload: QuizNotificationPayload = {
    kind: NotificationPayloadKind.QUIZ,
    class_id: input.classId,
    session_id: input.sessionId,
    session_date: input.sessionDate,
    session_number: input.sessionNumber,
    quiz_id: input.quizId,
    quiz_title: title,
    question_count: input.questionCount,
    duration_minutes: input.durationMinutes,
    passing_score: input.passingScore,
  };

  return insertNotificationsForUsers({
    userIds,
    type: UserNotificationType.QUIZ_PUBLISHED,
    title: 'Có bài tập mới',
    body: `Buổi ${input.sessionNumber}: ${title}`,
    payload,
  });
}

export async function notifyStudentsLectureCreatedSafe(
  input: Parameters<typeof notifyStudentsLectureCreated>[0],
): Promise<void> {
  try {
    await notifyStudentsLectureCreated(input);
  } catch {
  }
}

export async function notifyStudentsQuizPublishedSafe(
  input: Parameters<typeof notifyStudentsQuizPublished>[0],
): Promise<void> {
  try {
    await notifyStudentsQuizPublished(input);
  } catch {
  }
}

export async function deleteQuizNotificationsSafe(quizId: string): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase
      .from('user_notifications')
      .delete()
      .eq('type', UserNotificationType.QUIZ_PUBLISHED)
      .contains('payload', { quiz_id: quizId });
  } catch {
  }
}

export async function listUnreadSessionKinds(
  userId: string,
  sessionIds: string[],
): Promise<Set<string>> {
  const result = new Set<string>();
  if (sessionIds.length === 0) return result;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('user_notifications')
    .select('type, payload')
    .eq('user_id', userId)
    .is('read_at', null)
    .in('type', [UserNotificationType.LECTURE_CREATED, UserNotificationType.QUIZ_PUBLISHED]);

  throwIfSupabaseError(error, UserNotificationErrorCode.FETCH_FAILED);

  const sessionIdSet = new Set(sessionIds);
  for (const row of (data as unknown as { type: string; payload: Record<string, unknown> | null }[]) ||
    []) {
    const sessionId = row.payload?.session_id as string | undefined;
    if (!sessionId || !sessionIdSet.has(sessionId)) continue;
    const kind =
      row.type === UserNotificationType.LECTURE_CREATED
        ? NotificationPayloadKind.LECTURE
        : NotificationPayloadKind.QUIZ;
    result.add(`${sessionId}:${kind}`);
  }
  return result;
}

export async function markSessionNotificationsRead(
  userId: string,
  sessionId: string,
  kind: NotificationPayloadKind,
): Promise<number> {
  const type =
    kind === NotificationPayloadKind.LECTURE
      ? UserNotificationType.LECTURE_CREATED
      : UserNotificationType.QUIZ_PUBLISHED;
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('user_notifications')
    .update({ read_at: now, updated_at: now } as never)
    .eq('user_id', userId)
    .eq('type', type)
    .is('read_at', null)
    .contains('payload', { session_id: sessionId })
    .select('id');

  throwIfSupabaseError(error, UserNotificationErrorCode.UPDATE_FAILED);
  return ((data as unknown as { id: string }[]) || []).length;
}

export async function listMyNotifications(
  userId: string,
  opts?: { unreadOnly?: boolean; limit?: number },
): Promise<UserNotification[]> {
  const limit = Math.min(
    opts?.limit ?? UserNotificationLimit.LIST_DEFAULT,
    UserNotificationLimit.LIST_MAX,
  );
  const supabase = createAdminClient();
  let query = supabase
    .from('user_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (opts?.unreadOnly) {
    query = query.is('read_at', null);
  }

  const { data, error } = await query;
  throwIfSupabaseError(error, UserNotificationErrorCode.FETCH_FAILED);
  return ((data as unknown as Record<string, unknown>[]) || []).map(mapNotification);
}

export async function countMyUnreadNotifications(userId: string): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from('user_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);

  throwIfSupabaseError(error, UserNotificationErrorCode.FETCH_FAILED);
  return count ?? 0;
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<UserNotification> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('user_notifications')
    .update({ read_at: now, updated_at: now } as never)
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select('*')
    .single();

  throwIfSupabaseError(error, UserNotificationErrorCode.UPDATE_FAILED);
  if (!data) fail(UserNotificationErrorCode.NOT_FOUND, HttpStatusCode.NOT_FOUND);
  return mapNotification(data as unknown as Record<string, unknown>);
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('user_notifications')
    .update({ read_at: now, updated_at: now } as never)
    .eq('user_id', userId)
    .is('read_at', null)
    .select('id');

  throwIfSupabaseError(error, UserNotificationErrorCode.UPDATE_FAILED);
  return ((data as unknown as { id: string }[]) || []).length;
}
