'use client';

import {
  App,
  Breadcrumb,
  Button,
  Form,
  Input,
  InputNumber,
  Result,
  Spin,
  Checkbox,
  Typography,
  Upload,
} from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import type { UploadProps } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import {
  ClassMemberRole,
  HttpStatusCode,
  QuizErrorCode,
  QuizLimit,
  QuizUiMessage,
} from '@/constants/enums';
import { FetchJsonError } from '@/lib/utils/fetchJson';
import { useAuthPermission } from '@/lib/hooks/use-auth-permission';
import { useClass } from '@/lib/hooks/use-classes';
import { useClassSessions } from '@/lib/hooks/use-class-sessions';
import { useUserRoleCode } from '@/lib/hooks/use-current-user';
import {
  useCreateSessionQuiz,
  useSessionQuizDetail,
  useUpdateSessionQuiz,
} from '@/lib/hooks/use-quizzes';
import {
  getImageUploadRejectMessage,
  getImageUploadRejectReason,
  uploadSessionImage,
} from '@/lib/utils/upload-session-image';
import { getErrorMessage } from '@/lib/utils/get-error-message';
import { QuizQuestionsSection } from './QuizQuestionsSection';
import {
  fillQuizForm,
  toQuizPayload,
  type QuizFormValues,
  type QuizQuestionForm,
} from './quiz-editor.utils';
import pageStyles from './lecture-editor.module.scss';
import formStyles from './quiz-editor.module.scss';

dayjs.locale('vi');

// Server-thrown AppError codes without a custom message reach the client as the
// raw code string (e.g. "QUIZ_DUPLICATE_OPTION_TEXT") — map the known ones to copy.
const QUIZ_ERROR_MESSAGES: Partial<Record<string, string>> = {
  [QuizErrorCode.FORBIDDEN]: QuizUiMessage.FORBIDDEN,
  [QuizErrorCode.TITLE_REQUIRED]: QuizUiMessage.TITLE_REQUIRED,
  [QuizErrorCode.QUESTIONS_REQUIRED]: QuizUiMessage.QUESTIONS_REQUIRED,
  [QuizErrorCode.QUESTION_PROMPT_REQUIRED]: QuizUiMessage.PROMPT_REQUIRED,
  [QuizErrorCode.OPTION_TEXT_REQUIRED]: QuizUiMessage.OPTION_REQUIRED,
  [QuizErrorCode.DUPLICATE_OPTION_TEXT]: QuizUiMessage.DUPLICATE_OPTION_TEXT,
  [QuizErrorCode.CORRECT_ANSWER_REQUIRED]: QuizUiMessage.CORRECT_MULTI_REQUIRED,
  [QuizErrorCode.SINGLE_ONE_ANSWER]: QuizUiMessage.CORRECT_SINGLE_REQUIRED,
};

function resolveQuizErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof FetchJsonError) {
    const code = (error.data as { code?: string } | undefined)?.code;
    if (code && QUIZ_ERROR_MESSAGES[code]) {
      return QUIZ_ERROR_MESSAGES[code]!;
    }
  }
  return getErrorMessage(error, fallback);
}

type Props = {
  mode: 'create' | 'edit';
  classId: string;
  sessionId: string;
  quizId?: string;
};

export function QuizEditorPage({ mode, classId, sessionId, quizId }: Props) {
  const { message, modal } = App.useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateQuery = searchParams.get('date');
  const isCreate = mode === 'create';
  const pageTitle = isCreate ? 'Thêm bài tập' : 'Sửa bài tập';
  const submitLabel = isCreate ? 'Đăng bài' : 'Cập nhật';
  const roleCode = useUserRoleCode();
  const homeHref = roleCode?.trim().toUpperCase() === 'STU' ? '/course' : '/';
  const { hasPermission: canEdit, isLoading: permissionLoading } = useAuthPermission([
    ClassMemberRole.TEA,
  ]);

  const { data: classData, isLoading: classLoading } = useClass(classId);
  const { data: sessions = [], isLoading: sessionsLoading } = useClassSessions(classId);
  const {
    data: existing,
    isLoading: quizLoading,
    isError: quizMissing,
  } = useSessionQuizDetail(sessionId, quizId ?? null, !isCreate && !!quizId);

  const createQuiz = useCreateSessionQuiz(classId);
  const updateQuiz = useUpdateSessionQuiz(classId);

  const [form] = Form.useForm<QuizFormValues>();
  const isPublished = Form.useWatch('is_published', form);
  const [uploadingQuestionId, setUploadingQuestionId] = useState<string | null>(null);
  const [activeKeys, setActiveKeys] = useState<string[]>(['0']);
  const [hydrated, setHydrated] = useState(isCreate);

  const session = sessions.find((item) => item.id === sessionId) ?? null;

  const scheduleParams = new URLSearchParams();
  scheduleParams.set('tab', 'schedule');
  if (dateQuery) scheduleParams.set('date', dateQuery);
  else if (session?.date) scheduleParams.set('date', session.date);
  const scheduleHref = `/class/${classId}?${scheduleParams.toString()}`;

  const leaveTo = (href: string) => {
    if (form.isFieldsTouched()) {
      modal.confirm({
        title: QuizUiMessage.UNSAVED_TITLE,
        content: QuizUiMessage.UNSAVED_CONTENT,
        okText: QuizUiMessage.UNSAVED_LEAVE,
        okButtonProps: { danger: true },
        cancelText: QuizUiMessage.UNSAVED_STAY,
        onOk: () => router.push(href),
      });
      return;
    }
    router.push(href);
  };

  const goBack = () => leaveTo(scheduleHref);

  useEffect(() => {
    if (isCreate) {
      fillQuizForm(form, null);
      setActiveKeys(['0']);
      setHydrated(true);
      return;
    }
    if (quizLoading) return;
    if (!existing) {
      setHydrated(true);
      return;
    }
    fillQuizForm(form, existing);
    const questions = (form.getFieldValue('questions') as QuizQuestionForm[] | undefined) ?? [];
    setActiveKeys([String(Math.max(0, questions.length - 1))]);
    setHydrated(true);
  }, [isCreate, quizLoading, existing, form]);

  const uploadQuestionImage = (questionId: string): UploadProps => ({
    name: 'file',
    accept: 'image/*',
    showUploadList: false,
    beforeUpload: (file) => {
      const rejectReason = getImageUploadRejectReason(file);
      if (rejectReason) {
        message.error(getImageUploadRejectMessage(rejectReason));
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        setUploadingQuestionId(questionId);
        const uploaded = await uploadSessionImage(file as File);
        // Re-resolve the question by stable id, not the index captured at
        // upload start: questions may have been added/removed/reordered
        // while the upload was in flight.
        const questions = form.getFieldValue('questions') as QuizQuestionForm[];
        const targetIndex = questions.findIndex((question) => question.id === questionId);
        if (targetIndex === -1) {
          onSuccess?.(uploaded);
          return;
        }
        const current = questions[targetIndex];
        const currentUrls = current.image_urls ?? [];
        if (currentUrls.length >= QuizLimit.MAX_IMAGES_PER_QUESTION) {
          message.warning(QuizUiMessage.MAX_IMAGES);
          onSuccess?.(uploaded);
          return;
        }
        const next = [...questions];
        next[targetIndex] = {
          ...current,
          image_urls: [...currentUrls, uploaded.url],
        };
        form.setFieldsValue({ questions: next });
        message.success(QuizUiMessage.IMAGE_ADDED);
        onSuccess?.(uploaded);
      } catch (error) {
        message.error(getErrorMessage(error, QuizUiMessage.UPLOAD_FAILED));
        onError?.(error as Error);
      } finally {
        setUploadingQuestionId(null);
      }
    },
  });

  const saving =
    createQuiz.isPending || updateQuiz.isPending || uploadingQuestionId !== null;

  const performSubmit = async (values: QuizFormValues) => {
    try {
      const payload = toQuizPayload(values);
      if (!isCreate && quizId) {
        await updateQuiz.mutateAsync({
          sessionId,
          quizId,
          data: { ...payload, expected_updated_at: existing?.updated_at },
        });
        message.success(QuizUiMessage.UPDATED);
      } else {
        await createQuiz.mutateAsync({ sessionId, data: payload });
        message.success(QuizUiMessage.CREATED);
      }
      goBack();
    } catch (error: unknown) {
      if (error instanceof FetchJsonError && error.status === HttpStatusCode.CONFLICT) {
        modal.confirm({
          title: QuizUiMessage.CONFLICT_TITLE,
          content: QuizUiMessage.CONFLICT_CONTENT,
          okText: QuizUiMessage.CONFLICT_RELOAD,
          cancelText: QuizUiMessage.CONFLICT_LATER,
          onOk: () => window.location.reload(),
        });
        return;
      }
      message.error(resolveQuizErrorMessage(error, QuizUiMessage.SAVE_FAILED));
    }
  };

  const handleSubmit = (values: QuizFormValues) => {
    // Flipping a quiz to published fires an immediate notification to every
    // student in the class — that's a one-way action worth a confirm step.
    const willFirstPublish = Boolean(values.is_published) && !existing?.is_published;
    if (willFirstPublish) {
      modal.confirm({
        title: QuizUiMessage.PUBLISH_CONFIRM_TITLE,
        content: QuizUiMessage.PUBLISH_CONFIRM_CONTENT,
        okText: QuizUiMessage.PUBLISH_CONFIRM_OK,
        cancelText: QuizUiMessage.PUBLISH_CONFIRM_CANCEL,
        onOk: () => performSubmit(values),
      });
      return;
    }
    void performSubmit(values);
  };

  const loading =
    classLoading ||
    sessionsLoading ||
    permissionLoading ||
    (!isCreate && (quizLoading || !hydrated));

  if (loading) {
    return (
      <div className={pageStyles.page}>
        <div className={pageStyles.loadingWrap}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className={pageStyles.page}>
        <div className={pageStyles.errorWrap}>
          <Result
            status="403"
            title="Không có quyền truy cập"
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

  if (!isCreate && (quizMissing || !existing)) {
    return (
      <div className={pageStyles.page}>
        <div className={pageStyles.errorWrap}>
          <Result
            status="404"
            title="Không tìm thấy bài tập"
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
          { title: <HomeOutlined />, onClick: () => leaveTo(homeHref) },
          { title: classData?.name || 'Lớp học', onClick: () => leaveTo(`/class/${classId}`) },
          { title: 'Lịch học', onClick: () => leaveTo(scheduleHref) },
          { title: pageTitle },
        ]}
      />

      <div className={pageStyles.headerRow}>
        <Typography.Title level={3} className={pageStyles.pageTitle}>
          {pageTitle}
        </Typography.Title>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        disabled={saving}
      >
        <div className={pageStyles.layout}>
          <div className={pageStyles.mainColumn}>
            <div className={pageStyles.panel}>
              <div className={pageStyles.panelBody}>
                <Form.Item
                  name="title"
                  rules={[{ required: true, message: QuizUiMessage.TITLE_REQUIRED }]}
                  className={formStyles.titleField}
                >
                  <Input
                    className={pageStyles.titleInput}
                    placeholder="Nhập tiêu đề bài tập"
                    maxLength={200}
                    variant="borderless"
                  />
                </Form.Item>
              </div>
            </div>

            <div className={pageStyles.panel}>
              <div className={pageStyles.panelBody}>
                <div className={formStyles.metaRow}>
                  <Form.Item
                    name="duration_minutes"
                    label="Thời gian (phút)"
                    extra="Áp dụng cho cả bài (trắc nghiệm và tự luận). Để 0 nếu không giới hạn."
                    className={formStyles.metaItem}
                  >
                    <InputNumber
                      min={QuizLimit.DURATION_MIN}
                      max={QuizLimit.DURATION_MAX}
                      className={formStyles.numberInput}
                    />
                  </Form.Item>
                  <Form.Item
                    name="passing_score"
                    label="Điểm đạt (%)"
                    extra="Chỉ tính câu trắc nghiệm. Bài chỉ tự luận không dùng điểm này."
                    className={formStyles.metaItem}
                  >
                    <InputNumber
                      min={QuizLimit.PASSING_SCORE_MIN}
                      max={QuizLimit.PASSING_SCORE_MAX}
                      className={formStyles.numberInput}
                    />
                  </Form.Item>
                  <Form.Item
                    name="is_published"
                    valuePropName="checked"
                    className={formStyles.metaItem}
                  >
                    <Checkbox>Mở cho học viên</Checkbox>
                  </Form.Item>
                </div>
              </div>
            </div>

            <div className={pageStyles.panel}>
              <div className={pageStyles.panelBody}>
                <QuizQuestionsSection
                  form={form}
                  activeKeys={activeKeys}
                  onActiveKeysChange={setActiveKeys}
                  saving={saving}
                  uploadingQuestionId={uploadingQuestionId}
                  uploadQuestionImage={uploadQuestionImage}
                />
              </div>
            </div>

            <div className={pageStyles.mobileActions}>
              <Button block onClick={goBack} disabled={saving}>
                Hủy
              </Button>
              <Button type="primary" block loading={saving} htmlType="submit">
                {submitLabel}
              </Button>
            </div>
          </div>

          <aside className={pageStyles.sidebar}>
            <div className={pageStyles.panel}>
              <p className={pageStyles.sidebarBoxTitle}>Đăng bài</p>
              <div className={pageStyles.sidebarBoxBody}>
                <div className={pageStyles.metaLine}>
                  <span className={pageStyles.metaLabel}>Trạng thái</span>
                  <span className={pageStyles.metaValue}>
                    {isPublished ? 'Đã mở' : 'Bản nháp'}
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
                  <Button
                    type="primary"
                    className={pageStyles.saveBtn}
                    loading={saving}
                    htmlType="submit"
                  >
                    {submitLabel}
                  </Button>
                  <Button className={pageStyles.cancelBtn} onClick={goBack} disabled={saving}>
                    Hủy
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </Form>
    </div>
  );
}
