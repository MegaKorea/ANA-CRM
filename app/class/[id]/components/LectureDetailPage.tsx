'use client';

import { Breadcrumb, Button, Image, Result, Spin, Typography } from 'antd';
import { EditOutlined, HomeOutlined, LinkOutlined } from '@ant-design/icons';
import DOMPurify from 'isomorphic-dompurify';
import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { ClassMemberRole } from '@/constants/enums';
import { useAuthPermission } from '@/lib/hooks/use-auth-permission';
import { useUserRoleCode } from '@/lib/hooks/use-current-user';
import { useClass } from '@/lib/hooks/use-classes';
import { useClassSessions, useSessionLectures } from '@/lib/hooks/use-class-sessions';
import pageStyles from './lecture-editor.module.scss';
import styles from './lecture-detail.module.scss';

dayjs.locale('vi');

type Props = {
  classId: string;
  sessionId: string;
  lectureId: string;
};

export function LectureDetailPage({ classId, sessionId, lectureId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateQuery = searchParams.get('date');
  const { hasPermission: canEdit } = useAuthPermission([ClassMemberRole.TEA]);
  const roleCode = useUserRoleCode();
  const homeHref = roleCode?.trim().toUpperCase() === 'STU' ? '/course' : '/';

  const { data: classData, isLoading: classLoading } = useClass(classId);
  const { data: sessions = [], isLoading: sessionsLoading } = useClassSessions(classId);
  const { data: lectures = [], isLoading: lecturesLoading } = useSessionLectures(sessionId);

  const session = sessions.find((item) => item.id === sessionId) ?? null;
  const lecture = useMemo(
    () => lectures.find((item) => item.id === lectureId) ?? null,
    [lectures, lectureId],
  );

  const sanitizedHtml = useMemo(
    () => (lecture?.html ? DOMPurify.sanitize(lecture.html) : ''),
    [lecture],
  );

  const scheduleParams = new URLSearchParams();
  scheduleParams.set('tab', 'schedule');
  if (dateQuery) scheduleParams.set('date', dateQuery);
  else if (session?.date) scheduleParams.set('date', session.date);
  const scheduleHref = `/class/${classId}?${scheduleParams.toString()}`;
  const scheduleQuery = dateQuery ? `?date=${encodeURIComponent(dateQuery)}` : '';
  const editHref = `/class/${classId}/sessions/${sessionId}/lectures/${lectureId}/edit${scheduleQuery}`;

  const goBack = () => {
    router.push(scheduleHref);
  };

  const loading = classLoading || sessionsLoading || lecturesLoading;

  if (loading) {
    return (
      <div className={pageStyles.page}>
        <div className={pageStyles.loadingWrap}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (!lecture) {
    return (
      <div className={pageStyles.page}>
        <div className={pageStyles.errorWrap}>
          <Result
            status="404"
            title="Không tìm thấy bài giảng"
            extra={
              <Button type="primary" onClick={goBack}>
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

  return (
    <div className={pageStyles.page}>
      <Breadcrumb
        className={pageStyles.breadcrumb}
        items={[
          { href: homeHref, title: <HomeOutlined /> },
          { href: `/class/${classId}`, title: classData?.name || 'Lớp học' },
          { href: scheduleHref, title: 'Lịch học' },
          { title: lecture.title || 'Bài giảng' },
        ]}
      />

      <div className={pageStyles.headerRow}>
        <Typography.Title level={3} className={pageStyles.pageTitle}>
          {lecture.title || 'Bài giảng'}
          {canEdit && lecture.status === 'draft' ? (
            <Typography.Text type="warning" className={styles.draftBadge}>
              {' '}
              · Nháp
            </Typography.Text>
          ) : null}
        </Typography.Title>
      </div>

      <div className={pageStyles.layout}>
        <div className={pageStyles.mainColumn}>
          <div className={pageStyles.panel}>
            <div className={pageStyles.panelBody}>
              <div className={styles.body}>
                {sanitizedHtml ? (
                  <div
                    className={styles.content}
                    dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                  />
                ) : (
                  <Typography.Text type="secondary">Chưa có nội dung văn bản.</Typography.Text>
                )}

                {lecture.attachments.length > 0 ? (
                  <div className={styles.section}>
                    <Typography.Text strong>Ảnh đính kèm</Typography.Text>
                    <div className={styles.images}>
                      <Image.PreviewGroup>
                        {lecture.attachments.map((file) => (
                          <Image
                            key={file.url}
                            src={file.url}
                            alt={file.name}
                            width={120}
                            className={styles.attachmentImage}
                          />
                        ))}
                      </Image.PreviewGroup>
                    </div>
                  </div>
                ) : null}

                {lecture.links.length > 0 ? (
                  <div className={styles.section}>
                    <Typography.Text strong>Liên kết</Typography.Text>
                    <ul className={styles.links}>
                      {lecture.links.map((link) => (
                        <li key={link.url}>
                          <a href={link.url} target="_blank" rel="noreferrer">
                            <LinkOutlined /> {link.label || link.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className={pageStyles.mobileActions}>
            <Button block onClick={goBack}>
              Quay lại
            </Button>
            {canEdit ? (
              <Button
                type="primary"
                block
                icon={<EditOutlined />}
                onClick={() => router.push(editHref)}
              >
                Sửa
              </Button>
            ) : null}
          </div>
        </div>

        <aside className={pageStyles.sidebar}>
          <div className={pageStyles.panel}>
            <p className={pageStyles.sidebarBoxTitle}>Bài giảng</p>
            <div className={pageStyles.sidebarBoxBody}>
              <div className={pageStyles.metaLine}>
                <span className={pageStyles.metaLabel}>Trạng thái</span>
                <span className={pageStyles.metaValue}>
                  {lecture.status === 'draft' ? 'Bản nháp' : 'Đã đăng'}
                </span>
              </div>
              <div className={pageStyles.metaLine}>
                <span className={pageStyles.metaLabel}>Lớp</span>
                <span className={pageStyles.metaValue}>{classData?.name || '—'}</span>
              </div>
              <div className={pageStyles.metaLine}>
                <span className={pageStyles.metaLabel}>Buổi</span>
                <span className={pageStyles.metaValue}>{sessionLabel}</span>
              </div>
              <div className={`${pageStyles.sidebarActions} ${pageStyles.desktopOnlyActions}`}>
                {canEdit ? (
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    block
                    onClick={() => router.push(editHref)}
                  >
                    Sửa
                  </Button>
                ) : null}
                <Button onClick={goBack} block>
                  Quay lại
                </Button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
