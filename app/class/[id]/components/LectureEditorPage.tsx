'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  App,
  Breadcrumb,
  Button,
  Input,
  Result,
  Spin,
  Typography,
} from 'antd';
import { HomeOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter, useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { ClassMemberRole, LectureErrorCode, LectureUiMessage } from '@/constants/enums';
import { useAuthPermission } from '@/lib/hooks/use-auth-permission';
import { useClass } from '@/lib/hooks/use-classes';
import {
  useClassSessions,
  useCreateSessionLecture,
  useSessionLectures,
  useUpdateSessionLecture,
} from '@/lib/hooks/use-class-sessions';
import { useUserRoleCode } from '@/lib/hooks/use-current-user';
import type {
  SessionLectureAttachment,
  SessionLectureLink,
  SessionLectureStatus,
} from '@/lib/types/session-lecture';
import { collectImageAttachmentsFromHtml } from '@/lib/utils/lecture-html-attachments';
import { getErrorMessage } from '@/lib/utils/get-error-message';
import { FetchJsonError } from '@/lib/utils/fetchJson';
import type { UploadedImage } from '@/lib/utils/upload-session-image';
import { assertAllowedHttpUrl } from '@/lib/utils/assert-http-url';
import styles from './lecture-editor.module.scss';

dayjs.locale('vi');

const DRAFT_FALLBACK_TITLE = 'Bản nháp';

// Server-thrown AppError codes without a custom message reach the client as
// the raw code string (e.g. "LECTURE_FORBIDDEN") — map the known ones to copy.
const LECTURE_ERROR_MESSAGES: Partial<Record<string, string>> = {
  [LectureErrorCode.FORBIDDEN]: LectureUiMessage.FORBIDDEN,
  [LectureErrorCode.TITLE_REQUIRED]: LectureUiMessage.TITLE_REQUIRED,
  [LectureErrorCode.INVALID_LINK_URL]: LectureUiMessage.INVALID_URL,
  [LectureErrorCode.NOT_FOUND]: LectureUiMessage.NOT_FOUND,
};

function resolveLectureErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof FetchJsonError) {
    const code = (error.data as { code?: string } | undefined)?.code;
    if (code && LECTURE_ERROR_MESSAGES[code]) {
      return LECTURE_ERROR_MESSAGES[code]!;
    }
  }
  return getErrorMessage(error, fallback);
}

const LectureTiptapEditor = dynamic(
  () => import('./LectureTiptapEditor').then((m) => m.LectureTiptapEditor),
  {
    ssr: false,
    loading: () => (
      <div className={styles.loadingWrap}>
        <Spin />
      </div>
    ),
  },
);

type Props = {
  mode: 'create' | 'edit';
  classId: string;
  sessionId: string;
  lectureId?: string;
};

const emptyLink = (): SessionLectureLink => ({ label: '', url: '' });

function normalizeLinks(links: SessionLectureLink[]): SessionLectureLink[] {
  return links
    .map((link) => ({
      label: link.label.trim(),
      url: link.url.trim(),
    }))
    .filter((link) => link.url.length > 0)
    .map((link) => {
      assertAllowedHttpUrl(link.url);
      return {
        label: link.label || link.url,
        url: link.url,
      };
    });
}

function linksEqual(a: SessionLectureLink[], b: SessionLectureLink[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, i) => item.label === b[i]?.label && item.url === b[i]?.url);
}

function softNormalizeLinks(links: SessionLectureLink[]): SessionLectureLink[] {
  return links
    .map((link) => ({
      label: link.label.trim(),
      url: link.url.trim(),
    }))
    .filter((link) => {
      if (!link.url) return false;
      try {
        assertAllowedHttpUrl(link.url);
        return true;
      } catch {
        return false;
      }
    })
    .map((link) => ({
      label: link.label || link.url,
      url: link.url,
    }));
}

/** Best-effort save when the tab/app is closing (keepalive survives unload). */
function flushLectureBeacon(opts: {
  mode: 'create' | 'edit';
  sessionId: string;
  lectureId?: string;
  payload: {
    title: string;
    html: string;
    links: SessionLectureLink[];
    attachments: SessionLectureAttachment[];
    status: SessionLectureStatus;
  };
}) {
  const url =
    opts.mode === 'edit' && opts.lectureId
      ? `/api/classes/sessions/${opts.sessionId}/lectures/${opts.lectureId}`
      : `/api/classes/sessions/${opts.sessionId}/lectures`;
  const method = opts.mode === 'edit' && opts.lectureId ? 'PATCH' : 'POST';
  try {
    void fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts.payload),
      keepalive: true,
      credentials: 'same-origin',
    });
  } catch {
    // Ignore — unload path cannot surface errors.
  }
}

export function LectureEditorPage({ mode, classId, sessionId, lectureId }: Props) {
  const { message } = App.useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateQuery = searchParams.get('date');
  const roleCode = useUserRoleCode();
  const homeHref = roleCode?.trim().toUpperCase() === 'STU' ? '/course' : '/';
  const { hasPermission: canEdit, isLoading: permissionLoading } = useAuthPermission([
    ClassMemberRole.TEA,
  ]);

  const { data: classData, isLoading: classLoading } = useClass(classId);
  const { data: sessions = [], isLoading: sessionsLoading } = useClassSessions(classId);
  const { data: lectures = [], isLoading: lecturesLoading } = useSessionLectures(sessionId);
  const createLecture = useCreateSessionLecture(classId);
  const updateLecture = useUpdateSessionLecture(classId);

  const session = useMemo(
    () => sessions.find((item) => item.id === sessionId) ?? null,
    [sessions, sessionId],
  );

  const existing = useMemo(() => {
    if (mode !== 'edit' || !lectureId) return null;
    return lectures.find((item) => item.id === lectureId) ?? null;
  }, [mode, lectureId, lectures]);

  const [title, setTitle] = useState('');
  const [html, setHtml] = useState('');
  const [links, setLinks] = useState<SessionLectureLink[]>([]);
  const [attachments, setAttachments] = useState<SessionLectureAttachment[]>([]);
  const [hydratedLectureId, setHydratedLectureId] = useState<string | null>(null);
  const hydrated = mode === 'create' || hydratedLectureId === (lectureId ?? null);

  // Hydrate local editable state from the fetched lecture once per lectureId
  // (not on every `existing` reference change) so a background refetch of the
  // lectures list doesn't clobber the user's in-progress edits.
  if (mode === 'edit' && !lecturesLoading && !hydrated) {
    setHydratedLectureId(lectureId ?? null);
    if (existing) {
      setTitle(existing.title);
      setHtml(existing.html || '');
      setLinks(existing.links.length ? existing.links : []);
      setAttachments(existing.attachments ?? []);
    }
  }

  const scheduleHref = (() => {
    const params = new URLSearchParams();
    params.set('tab', 'schedule');
    if (dateQuery) params.set('date', dateQuery);
    else if (session?.date) params.set('date', session.date);
    return `/class/${classId}?${params.toString()}`;
  })();

  const goBack = useCallback(() => {
    router.push(scheduleHref);
  }, [router, scheduleHref]);

  const isDirty = useMemo(() => {
    const hasLocalContent =
      title.trim().length > 0 ||
      html.replace(/<[^>]+>/g, '').trim().length > 0 ||
      links.some((link) => link.url.trim().length > 0) ||
      attachments.length > 0;

    if (mode === 'create') return hasLocalContent;
    if (!existing) return false;
    return (
      title !== existing.title ||
      html !== (existing.html || '') ||
      !linksEqual(links, existing.links) ||
      JSON.stringify(attachments) !== JSON.stringify(existing.attachments ?? [])
    );
  }, [mode, existing, title, html, links, attachments]);

  const skipUnloadSaveRef = useRef(false);
  const draftStateRef = useRef({
    isDirty: false,
    mode,
    sessionId,
    lectureId,
    existingStatus: existing?.status as SessionLectureStatus | undefined,
    title,
    html,
    links,
    attachments,
  });

  useEffect(() => {
    draftStateRef.current = {
      isDirty,
      mode,
      sessionId,
      lectureId,
      existingStatus: existing?.status,
      title,
      html,
      links,
      attachments,
    };
  }, [isDirty, mode, sessionId, lectureId, existing?.status, title, html, links, attachments]);

  const flushSuddenExitSave = useCallback(() => {
    const s = draftStateRef.current;
    if (skipUnloadSaveRef.current || !s.isDirty) return;
    // Never silently touch a lecture that's already live for students —
    // an in-progress edit must only reach "published" via the explicit save button.
    if (s.mode === 'edit' && s.existingStatus === 'published') return;

    const textOnly = s.html.replace(/<[^>]+>/g, '').trim();
    const isEmptyCreate =
      s.mode === 'create' &&
      !s.title.trim() &&
      !textOnly &&
      !s.links.some((link) => link.url.trim()) &&
      s.attachments.length === 0;
    if (isEmptyCreate) return;

    // pagehide + effect cleanup can both run on the same leave — only save once.
    skipUnloadSaveRef.current = true;
    flushLectureBeacon({
      mode: s.mode,
      sessionId: s.sessionId,
      lectureId: s.lectureId,
      payload: {
        title: s.title.trim() || DRAFT_FALLBACK_TITLE,
        html: s.html,
        links: softNormalizeLinks(s.links),
        attachments: collectImageAttachmentsFromHtml(s.html, s.attachments),
        status: 'draft',
      },
    });
  }, []);

  useEffect(() => {
    const onPageHide = () => flushSuddenExitSave();
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      // SPA navigate away (sidebar, etc.)
      flushSuddenExitSave();
    };
  }, [flushSuddenExitSave]);

  const buildPayload = useCallback(
    (opts: { requireTitle: boolean; status: SessionLectureStatus }) => {
      const trimmedTitle = title.trim() || (opts.requireTitle ? '' : DRAFT_FALLBACK_TITLE);
      if (opts.requireTitle && !title.trim()) {
        throw new Error('TITLE_REQUIRED');
      }
      const normalizedLinks = normalizeLinks(links);
      const nextAttachments = collectImageAttachmentsFromHtml(html, attachments);
      return {
        title: trimmedTitle,
        html,
        links: normalizedLinks,
        attachments: nextAttachments,
        status: opts.status,
      };
    },
    [title, links, html, attachments],
  );

  const onImageUploaded = useCallback((file: UploadedImage) => {
    setAttachments((prev) => {
      if (prev.some((item) => item.url === file.url)) return prev;
      return [
        ...prev,
        {
          name: file.name,
          url: file.url,
          mime_type: file.mime_type,
          size: file.size,
        },
      ];
    });
  }, [setAttachments]);

  const saving = createLecture.isPending || updateLecture.isPending;

  const handleSave = useCallback(async () => {
    try {
      const payload = buildPayload({ requireTitle: true, status: 'published' });
      if (mode === 'edit' && lectureId) {
        await updateLecture.mutateAsync({
          sessionId,
          lectureId,
          data: payload,
        });
        message.success(LectureUiMessage.UPDATED);
      } else {
        await createLecture.mutateAsync({
          sessionId,
          data: payload,
        });
        message.success(LectureUiMessage.CREATED);
      }
      skipUnloadSaveRef.current = true;
      goBack();
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'TITLE_REQUIRED') {
        message.warning(LectureUiMessage.TITLE_REQUIRED);
        return;
      }
      message.error(resolveLectureErrorMessage(error, LectureUiMessage.SAVE_FAILED));
    }
  }, [
    buildPayload,
    mode,
    lectureId,
    sessionId,
    updateLecture,
    createLecture,
    goBack,
    message,
  ]);

  const leaveTo = useCallback(
    async (href: string) => {
      // Editing an already-published lecture: "Hủy" must genuinely discard —
      // never silently publish an unfinished edit to a record students can see.
      const isPublishedEdit = mode === 'edit' && existing?.status === 'published';
      if (!isDirty || isPublishedEdit) {
        if (isDirty && isPublishedEdit) {
          message.info(LectureUiMessage.DISCARDED_CHANGES);
        }
        skipUnloadSaveRef.current = true;
        router.push(href);
        return;
      }

      try {
        const payload = buildPayload({ requireTitle: false, status: 'draft' });
        // Skip empty create drafts (no meaningful content).
        const textOnly = payload.html.replace(/<[^>]+>/g, '').trim();
        const isEmptyCreate =
          mode === 'create' &&
          !title.trim() &&
          !textOnly &&
          payload.links.length === 0 &&
          payload.attachments.length === 0;
        if (!isEmptyCreate) {
          if (mode === 'edit' && lectureId) {
            await updateLecture.mutateAsync({
              sessionId,
              lectureId,
              data: payload,
            });
          } else {
            await createLecture.mutateAsync({
              sessionId,
              data: payload,
            });
          }
        }
      } catch (error: unknown) {
        message.error(resolveLectureErrorMessage(error, LectureUiMessage.SAVE_FAILED));
        return;
      }
      skipUnloadSaveRef.current = true;
      router.push(href);
    },
    [
      isDirty,
      router,
      mode,
      existing?.status,
      buildPayload,
      title,
      lectureId,
      sessionId,
      updateLecture,
      createLecture,
      message,
    ],
  );

  const loading =
    classLoading ||
    sessionsLoading ||
    permissionLoading ||
    (mode === 'edit' && (lecturesLoading || !hydrated));

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingWrap}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className={styles.page}>
        <div className={styles.errorWrap}>
          <Result
            status="403"
            title="Không có quyền truy cập"
            extra={
              <Button type="primary" onClick={() => void leaveTo(scheduleHref)}>
                Về lịch học
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  if (mode === 'edit' && !existing) {
    return (
      <div className={styles.page}>
        <div className={styles.errorWrap}>
          <Result
            status="404"
            title="Không tìm thấy bài giảng"
            extra={
              <Button type="primary" onClick={() => void leaveTo(scheduleHref)}>
                Về lịch học
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const sessionLabel = session
    ? `Buổi ${session.session_number} · ${dayjs(session.date).format('dd, DD/MM/YYYY')}`
    : sessionId;

  const statusLabel =
    mode === 'edit' && existing?.status === 'published' ? 'Đã đăng' : 'Bản nháp';

  return (
    <div className={styles.page}>
      <Breadcrumb
        className={styles.breadcrumb}
        items={[
          {
            title: <HomeOutlined />,
            onClick: () => void leaveTo(homeHref),
          },
          {
            title: classData?.name || 'Lớp học',
            onClick: () => void leaveTo(`/class/${classId}`),
          },
          {
            title: 'Lịch học',
            onClick: () => void leaveTo(scheduleHref),
          },
          { title: mode === 'create' ? 'Thêm bài giảng' : 'Sửa bài giảng' },
        ]}
      />

      <div className={styles.headerRow}>
        <Typography.Title level={3} className={styles.pageTitle}>
          {mode === 'create' ? 'Thêm bài giảng' : 'Sửa bài giảng'}
        </Typography.Title>
      </div>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <div className={styles.panel}>
            <div className={styles.panelBody}>
              <input
                className={styles.titleInput}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề tại đây"
                maxLength={200}
                disabled={saving}
              />
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelBody}>
              <LectureTiptapEditor
                value={html}
                onChange={setHtml}
                onImageUploaded={onImageUploaded}
                disabled={saving}
              />
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelBody}>
              <div className={styles.linksHead}>
                <p className={styles.panelHeading}>Liên kết</p>
                <Button
                  type="link"
                  size="small"
                  icon={<PlusOutlined />}
                  disabled={saving}
                  onClick={() => setLinks((prev) => [...prev, emptyLink()])}
                >
                  Thêm link
                </Button>
              </div>
              {links.length === 0 ? (
                <Typography.Text type="secondary">Chưa có liên kết ngoài.</Typography.Text>
              ) : (
                links.map((link, index) => (
                  <div key={`link-${index}`} className={styles.linkRow}>
                    <Input
                      className={styles.linkInput}
                      placeholder="Nhãn"
                      value={link.label}
                      disabled={saving}
                      onChange={(e) => {
                        const value = e.target.value;
                        setLinks((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, label: value } : item)),
                        );
                      }}
                    />
                    <Input
                      className={styles.linkInput}
                      placeholder="https://"
                      value={link.url}
                      disabled={saving}
                      onChange={(e) => {
                        const value = e.target.value;
                        setLinks((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, url: value } : item)),
                        );
                      }}
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      disabled={saving}
                      onClick={() => setLinks((prev) => prev.filter((_, i) => i !== index))}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles.mobileActions}>
            <Button block onClick={() => void leaveTo(scheduleHref)} disabled={saving}>
              Hủy
            </Button>
            <Button type="primary" block loading={saving} onClick={() => void handleSave()}>
              {mode === 'create' || existing?.status === 'draft' ? 'Đăng bài' : 'Cập nhật'}
            </Button>
          </div>
        </div>

        <aside className={styles.sidebar}>
          <div className={styles.panel}>
            <p className={styles.sidebarBoxTitle}>Đăng bài</p>
            <div className={styles.sidebarBoxBody}>
              <div className={styles.metaLine}>
                <span className={styles.metaLabel}>Trạng thái</span>
                <span className={styles.metaValue}>{statusLabel}</span>
              </div>
              <div className={styles.metaLine}>
                <span className={styles.metaLabel}>Lớp</span>
                <span className={styles.metaValue}>{classData?.name || '—'}</span>
              </div>
              <div className={styles.metaLine}>
                <span className={styles.metaLabel}>Buổi</span>
                <span className={styles.metaValue}>{sessionLabel}</span>
              </div>
              <div className={`${styles.sidebarActions} ${styles.desktopOnlyActions}`}>
                <Button
                  type="primary"
                  className={styles.saveBtn}
                  loading={saving}
                  onClick={() => void handleSave()}
                >
                  {mode === 'create' || existing?.status === 'draft' ? 'Đăng bài' : 'Cập nhật'}
                </Button>
                <Button
                  className={styles.cancelBtn}
                  onClick={() => void leaveTo(scheduleHref)}
                  disabled={saving}
                >
                  Hủy
                </Button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
