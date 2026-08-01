'use client';

import {
  Breadcrumb,
  Button,
  Form,
  Input,
  InputNumber,
  Result,
  Spin,
  Switch,
  Typography,
  Upload,
  message,
} from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import type { UploadProps } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { QuizLimit, QuizUiMessage } from '@/constants/enums';
import { useClass } from '@/lib/hooks/use-classes';
import { useClassSessions } from '@/lib/hooks/use-class-sessions';
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

type Props = {
  mode: 'create' | 'edit';
  classId: string;
  sessionId: string;
  quizId?: string;
};

export function QuizEditorPage({ mode, classId, sessionId, quizId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateQuery = searchParams.get('date');
  const isCreate = mode === 'create';
  const pageTitle = isCreate ? 'Thêm bài tập' : 'Sửa bài tập';
  const submitLabel = isCreate ? 'Đăng bài' : 'Cập nhật';

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
  const [uploadingQuestionIndex, setUploadingQuestionIndex] = useState<number | null>(null);
  const [activeKeys, setActiveKeys] = useState<string[]>(['0']);
  const [hydrated, setHydrated] = useState(isCreate);

  const session = sessions.find((item) => item.id === sessionId) ?? null;

  const scheduleParams = new URLSearchParams();
  scheduleParams.set('tab', 'schedule');
  if (dateQuery) scheduleParams.set('date', dateQuery);
  else if (session?.date) scheduleParams.set('date', session.date);
  const scheduleHref = `/class/${classId}?${scheduleParams.toString()}`;

  const goBack = () => {
    router.push(scheduleHref);
  };

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

  const uploadQuestionImage = (questionIndex: number): UploadProps => ({
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
        setUploadingQuestionIndex(questionIndex);
        const uploaded = await uploadSessionImage(file as File);
        const questions = form.getFieldValue('questions') as QuizQuestionForm[];
        const current = questions[questionIndex];
        const currentUrls = current.image_urls ?? [];
        if (currentUrls.length >= QuizLimit.MAX_IMAGES_PER_QUESTION) {
          message.warning(QuizUiMessage.MAX_IMAGES);
          onSuccess?.(uploaded);
          return;
        }
        const next = [...questions];
        next[questionIndex] = {
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
        setUploadingQuestionIndex(null);
      }
    },
  });

  const saving =
    createQuiz.isPending || updateQuiz.isPending || uploadingQuestionIndex !== null;

  const handleSubmit = async (values: QuizFormValues) => {
    try {
      const payload = toQuizPayload(values);
      if (!isCreate && quizId) {
        await updateQuiz.mutateAsync({ sessionId, quizId, data: payload });
        message.success(QuizUiMessage.UPDATED);
      } else {
        await createQuiz.mutateAsync({ sessionId, data: payload });
        message.success(QuizUiMessage.CREATED);
      }
      goBack();
    } catch (error: unknown) {
      message.error(getErrorMessage(error, QuizUiMessage.SAVE_FAILED));
    }
  };

  const loading =
    classLoading || sessionsLoading || (!isCreate && (quizLoading || !hydrated));

  if (loading) {
    return (
      <div className={pageStyles.page}>
        <div className={pageStyles.loadingWrap}>
          <Spin size="large" />
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
          { href: '/', title: <HomeOutlined /> },
          { href: `/class/${classId}`, title: classData?.name || 'Lớp học' },
          { href: scheduleHref, title: 'Lịch học' },
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
        onFinish={(values) => void handleSubmit(values)}
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
                    label="Mở cho học viên"
                    valuePropName="checked"
                    className={formStyles.metaItem}
                  >
                    <Switch />
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
                  uploadingQuestionIndex={uploadingQuestionIndex}
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
