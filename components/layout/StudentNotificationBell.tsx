'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Dropdown,
  Empty,
  Image,
  List,
  Modal,
  Space,
  Typography,
  theme,
} from 'antd';
import { BellOutlined, FormOutlined, ReadOutlined } from '@ant-design/icons';
import { ClassMemberRole, UserNotificationType } from '@/constants/enums';
import { useCurrentUser } from '@/lib/hooks/use-current-user';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMyNotifications,
} from '@/lib/hooks/use-user-notifications';
import type { UserNotification } from '@/lib/types/user-notification';
import {
  isLectureNotificationPayload,
  isQuizNotificationPayload,
} from '@/lib/types/user-notification';
import { QuizTakeModal } from '@/app/class/[id]/components/QuizTakeModal';
import { useQuery } from '@tanstack/react-query';
import { fetchJson } from '@/lib/utils/fetchJson';
import { formatViDateTime } from '@/lib/utils/format-vi-datetime';
import type { Quiz } from '@/lib/types/quiz';
import { useMyQuizAttempt } from '@/lib/hooks/use-quizzes';
import { useIsMobile } from '@/lib/hooks/use-mobile';

const { Text } = Typography;

type TakingQuizContext = {
  sessionId: string;
  quizId: string;
};

export function StudentNotificationBell() {
  const { token } = theme.useToken();
  const { user } = useCurrentUser();
  const isStudent = (user?.roleCode ?? '').toUpperCase() === ClassMemberRole.STU;
  const isMobile = useIsMobile();
  const { data, isLoading } = useMyNotifications(!!isStudent);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const [active, setActive] = useState<UserNotification | null>(null);
  const [takingQuiz, setTakingQuiz] = useState<TakingQuizContext | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const unreadCount = data?.unreadCount ?? 0;

  const lecturePayload = isLectureNotificationPayload(active?.payload) ? active.payload : null;
  const quizPayload = isQuizNotificationPayload(active?.payload) ? active.payload : null;
  const quizPreviewOpen = !!active && !!quizPayload;

  const { data: previewAttempt, isLoading: previewAttemptLoading } = useMyQuizAttempt(
    quizPreviewOpen ? quizPayload.session_id : null,
    quizPreviewOpen ? quizPayload.quiz_id : null,
  );
  const hasSubmittedPreview = !!previewAttempt;

  const quizQuery = useQuery({
    queryKey: ['notification-quiz', takingQuiz?.sessionId, takingQuiz?.quizId],
    queryFn: () =>
      fetchJson<Quiz>(
        `/api/classes/sessions/${takingQuiz!.sessionId}/quizzes/${takingQuiz!.quizId}`,
      ),
    enabled: !!takingQuiz,
  });

  const openNotification = useCallback(
    async (item: UserNotification) => {
      setDropdownOpen(false);
      setActive(item);
      if (!item.read_at) {
        try {
          await markRead.mutateAsync(item.id);
        } catch {
        }
      }
    },
    [markRead],
  );

  const closePreview = useCallback(() => {
    setActive(null);
  }, []);

  const startQuiz = useCallback(() => {
    if (!quizPayload) return;
    setDropdownOpen(false);
    setTakingQuiz({
      sessionId: quizPayload.session_id,
      quizId: quizPayload.quiz_id,
    });
    setActive(null);
  }, [quizPayload]);

  const handleDropdownOpenChange = useCallback(
    (open: boolean) => {
      if (open && (active || takingQuiz)) return;
      setDropdownOpen(open);
    },
    [active, takingQuiz],
  );

  if (!isStudent) return null;

  const dropdownContent = (
    <div
      style={{
        width: isMobile ? 'min(92vw, 340px)' : 340,
        maxHeight: isMobile ? 'min(60vh, 400px)' : 400,
        overflowY: 'auto',
        background: token.colorBgElevated,
        borderRadius: token.borderRadiusLG,
        boxShadow: token.boxShadowSecondary,
        padding: 8,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
          padding: '0 4px',
        }}
      >
        <Text strong>Thông báo</Text>
        {unreadCount > 0 ? (
          <Button
            type="link"
            size="small"
            loading={markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            Đánh dấu đã đọc
          </Button>
        ) : null}
      </div>
      {isLoading ? (
        <Text type="secondary">Đang tải…</Text>
      ) : items.length === 0 ? (
        <Empty description="Chưa có thông báo" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          size="small"
          dataSource={items}
          rowKey={(item) => item.id}
          renderItem={(item) => (
            <List.Item
              style={{
                cursor: 'pointer',
                background: item.read_at ? undefined : token.colorPrimaryBg,
                borderRadius: token.borderRadiusSM,
                padding: '8px 10px',
              }}
              onClick={() => openNotification(item)}
            >
              <List.Item.Meta
                avatar={
                  item.type === UserNotificationType.QUIZ_PUBLISHED ? (
                    <FormOutlined />
                  ) : (
                    <ReadOutlined />
                  )
                }
                title={
                  <Text strong={!item.read_at} style={{ fontSize: 13 }}>
                    {item.title}
                  </Text>
                }
                description={
                  <Space direction="vertical" size={0}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.body}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {formatViDateTime(item.created_at)}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <>
      <Dropdown
        open={dropdownOpen}
        onOpenChange={handleDropdownOpenChange}
        popupRender={() => dropdownContent}
        trigger={['click']}
        placement="bottomRight"
        destroyOnHidden
      >
        <Badge count={unreadCount} size="small" offset={[-2, 2]}>
          <Button type="text" icon={<BellOutlined />} aria-label="Thông báo học viên" />
        </Badge>
      </Dropdown>

      <Modal
        open={!!active && !!lecturePayload}
        title={lecturePayload?.lecture_title ?? 'Bài giảng'}
        onCancel={closePreview}
        footer={
          <Button type="primary" onClick={closePreview}>
            Đóng
          </Button>
        }
        width={isMobile ? '95vw' : 560}
        destroyOnHidden
      >
        {lecturePayload ? (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Text type="secondary">
              Buổi {lecturePayload.session_number} · {lecturePayload.session_date}
            </Text>
            {lecturePayload.html ? (
              <Text style={{ whiteSpace: 'pre-wrap' }}>{lecturePayload.html}</Text>
            ) : (
              <Text type="secondary">Không có nội dung mô tả</Text>
            )}
            {lecturePayload.attachments.length > 0 ? (
              <Image.PreviewGroup>
                <Space wrap>
                  {lecturePayload.attachments.map((file) => (
                    <Image
                      key={file.url}
                      src={file.url}
                      alt={file.name}
                      width={96}
                      height={72}
                      style={{ objectFit: 'cover', borderRadius: 6 }}
                    />
                  ))}
                </Space>
              </Image.PreviewGroup>
            ) : null}
            {lecturePayload.links.length > 0 ? (
              <Space direction="vertical" size={4}>
                {lecturePayload.links.map((link) => (
                  <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
                    {link.label || link.url}
                  </a>
                ))}
              </Space>
            ) : null}
          </Space>
        ) : null}
      </Modal>

      <Modal
        open={!!active && !!quizPayload}
        title={quizPayload?.quiz_title ?? 'Bài tập'}
        onCancel={closePreview}
        footer={
          <Space>
            <Button onClick={closePreview}>Đóng</Button>
            <Button type="primary" loading={previewAttemptLoading} onClick={startQuiz}>
              {hasSubmittedPreview ? 'Xem' : 'Làm bài'}
            </Button>
          </Space>
        }
        width={isMobile ? '95vw' : 480}
        destroyOnHidden
      >
        {quizPayload ? (
          <Space direction="vertical" size="small">
            <Text type="secondary">
              Buổi {quizPayload.session_number} · {quizPayload.session_date}
            </Text>
            <Text>
              {quizPayload.question_count} câu
              {quizPayload.duration_minutes > 0
                ? ` · ${quizPayload.duration_minutes} phút`
                : ''}
              {quizPayload.passing_score > 0 ? ` · Đạt ${quizPayload.passing_score}%` : ''}
            </Text>
          </Space>
        ) : null}
      </Modal>

      {takingQuiz ? (
        <QuizTakeModal
          sessionId={takingQuiz.sessionId}
          quiz={quizQuery.data ?? null}
          open
          isMobile={isMobile}
          onClose={() => setTakingQuiz(null)}
        />
      ) : null}
    </>
  );
}
