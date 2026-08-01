export enum LectureErrorCode {
  FORBIDDEN = 'LECTURE_FORBIDDEN',
  INVALID_INPUT = 'LECTURE_INVALID_INPUT',
  TITLE_REQUIRED = 'LECTURE_TITLE_REQUIRED',
  INVALID_LINKS = 'LECTURE_INVALID_LINKS',
  INVALID_LINK_URL = 'LECTURE_INVALID_LINK_URL',
  INVALID_ATTACHMENTS = 'LECTURE_INVALID_ATTACHMENTS',
  NOT_FOUND = 'LECTURE_NOT_FOUND',
  SAVE_FAILED = 'LECTURE_SAVE_FAILED',
  INTERNAL = 'LECTURE_INTERNAL_ERROR',
}

export enum QuizErrorCode {
  FORBIDDEN = 'QUIZ_FORBIDDEN',
  FORBIDDEN_SUBMIT = 'QUIZ_FORBIDDEN_SUBMIT',
  INVALID_INPUT = 'QUIZ_INVALID_INPUT',
  TITLE_REQUIRED = 'QUIZ_TITLE_REQUIRED',
  QUESTIONS_REQUIRED = 'QUIZ_QUESTIONS_REQUIRED',
  INVALID_QUESTION = 'QUIZ_INVALID_QUESTION',
  QUESTION_PROMPT_REQUIRED = 'QUIZ_QUESTION_PROMPT_REQUIRED',
  OPTIONS_REQUIRED = 'QUIZ_OPTIONS_REQUIRED',
  INVALID_OPTION = 'QUIZ_INVALID_OPTION',
  OPTION_TEXT_REQUIRED = 'QUIZ_OPTION_TEXT_REQUIRED',
  CORRECT_ANSWER_REQUIRED = 'QUIZ_CORRECT_ANSWER_REQUIRED',
  SINGLE_ONE_ANSWER = 'QUIZ_SINGLE_ONE_ANSWER',
  DUPLICATE_OPTION_TEXT = 'QUIZ_DUPLICATE_OPTION_TEXT',
  ANSWERS_REQUIRED = 'QUIZ_ANSWERS_REQUIRED',
  NOT_FOUND = 'QUIZ_NOT_FOUND',
  NOT_PUBLISHED = 'QUIZ_NOT_PUBLISHED',
  ALREADY_SUBMITTED = 'QUIZ_ALREADY_SUBMITTED',
  CREATE_FAILED = 'QUIZ_CREATE_FAILED',
  UPDATE_FAILED = 'QUIZ_UPDATE_FAILED',
  DELETE_FAILED = 'QUIZ_DELETE_FAILED',
  FETCH_FAILED = 'QUIZ_FETCH_FAILED',
  ATTEMPT_FETCH_FAILED = 'QUIZ_ATTEMPT_FETCH_FAILED',
  ATTEMPT_FAILED = 'QUIZ_ATTEMPT_FAILED',
  ATTEMPT_NOT_STARTED = 'QUIZ_ATTEMPT_NOT_STARTED',
  ATTEMPT_NOT_FOUND = 'QUIZ_ATTEMPT_NOT_FOUND',
  ATTEMPT_NOT_COMPLETED = 'QUIZ_ATTEMPT_NOT_COMPLETED',
  FEEDBACK_REQUIRED = 'QUIZ_FEEDBACK_REQUIRED',
  GRADE_FAILED = 'QUIZ_GRADE_FAILED',
  CONFLICT = 'QUIZ_CONFLICT',
  HAS_QUIZ_SYNC_FAILED = 'QUIZ_HAS_QUIZ_SYNC_FAILED',
  INTERNAL = 'QUIZ_INTERNAL_ERROR',
}

export enum QuizQuestionType {
  SINGLE = 'single',
  MULTIPLE = 'multiple',
  ESSAY = 'essay',
}

export enum QuizAttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum ClassMemberRole {
  TEA = 'TEA',
  STU = 'STU',
  ADMIN = 'ADMIN',
}

export enum QuizLimit {
  PASSING_SCORE_DEFAULT = 50,
  PASSING_SCORE_MIN = 0,
  PASSING_SCORE_MAX = 100,
  DURATION_MIN = 0,
  DURATION_MAX = 300,
  MIN_OPTIONS = 2,
  MIN_QUESTIONS = 1,
  MAX_IMAGES_PER_QUESTION = 10,
  MAX_ESSAY_LENGTH = 5000,
  TIMER_WARN_SECONDS = 60,
  SECONDS_PER_MINUTE = 60,
}

export enum UploadImageLimit {
  MAX_MB = 10,
  BYTES_PER_MB = 1048576,
}

export enum UploadImageRejectReason {
  TYPE_INVALID = 'IMAGE_TYPE_INVALID',
  SIZE_EXCEEDED = 'IMAGE_SIZE_EXCEEDED',
}

export enum UploadImageRejectMessage {
  TYPE_INVALID = 'Chỉ chấp nhận file ảnh',
  SIZE_EXCEEDED = 'Ảnh phải nhỏ hơn 10MB',
}

export enum UploadErrorCode {
  FAILED = 'UPLOAD_FAILED',
}

export enum AllowedUrlProtocol {
  HTTP = 'http:',
  HTTPS = 'https:',
}

export enum QuizUiMessage {
  CREATED = 'Đã tạo bài tập',
  UPDATED = 'Đã cập nhật bài tập',
  DELETED = 'Đã xóa bài tập',
  SAVE_FAILED = 'Lưu bài tập thất bại',
  DELETE_FAILED = 'Xóa bài tập thất bại',
  IMAGE_ADDED = 'Đã thêm ảnh',
  UPLOAD_FAILED = 'Upload thất bại',
  MAX_IMAGES = 'Đã đạt số ảnh tối đa mỗi câu',
  NO_QUESTION_IMAGES = 'Chưa có ảnh (tối đa 10 ảnh / câu)',
  TITLE_REQUIRED = 'Nhập tiêu đề bài tập',
  PROMPT_REQUIRED = 'Nhập nội dung câu hỏi',
  OPTION_REQUIRED = 'Nhập lựa chọn',
  CORRECT_MULTI_REQUIRED = 'Chọn ít nhất 1 đáp án đúng',
  CORRECT_SINGLE_REQUIRED = 'Chọn 1 đáp án đúng',
  DUPLICATE_OPTION_TEXT = 'Có 2 lựa chọn trùng nội dung trong cùng một câu hỏi',
  FORBIDDEN = 'Bạn không có quyền thực hiện thao tác này',
  QUESTIONS_REQUIRED = 'Cần ít nhất 1 câu hỏi',
  ESSAY_HINT = 'Học viên sẽ nhập câu trả lời tự do',
  ESSAY_PLACEHOLDER = 'Nhập câu trả lời…',
  ESSAY_TAG = 'Tự luận',
  ESSAY_PENDING = 'Tự luận — giáo viên xem thủ công',
  ESSAY_SUBMITTED_TITLE = 'Đã nộp bài',
  ESSAY_AWAITING_REVIEW = 'chờ giáo viên xem',
  RESULT_MCQ_SCORE_SUFFIX = '(trắc nghiệm)',
  RESULT_PASSED = 'Đạt',
  RESULT_FAILED = 'Chưa đạt',
  ESSAY_EMPTY = '(Chưa trả lời)',
  TAKE_HINT = 'Nhấn để xem thông tin',
  VIEW_HINT = 'Nhấn để xem',
  START_QUIZ = 'Làm bài',
  CONTINUE_QUIZ = 'Tiếp tục làm bài',
  VIEW_RESULT = 'Xem',
  CLOSE = 'Đóng',
  PREVIEW_READY = 'Xem thông tin rồi nhấn Làm bài để bắt đầu',
  PREVIEW_READY_WITH_TIMER = 'Thời gian làm bài {minutes} phút — nhấn Làm bài để bắt đầu',
  PREVIEW_IN_PROGRESS = 'Bạn đang làm bài — thời gian vẫn đang chạy',
  PREVIEW_IN_PROGRESS_NO_TIMER = 'Bạn đang làm bài dở',
  PREVIEW_SUBMITTED_PREFIX = 'Bạn đã nộp bài',
  PREVIEW_ESSAY_SUBMITTED = 'Đã nộp — chờ giáo viên xem',
  CONTINUE_HINT = 'Nhấn để tiếp tục làm bài',
  UNANSWERED = 'Còn câu hỏi chưa trả lời',
  SUBMITTED = 'Đã nộp bài',
  TIMEOUT_SUBMITTED = 'Hết giờ — đã nộp bài',
  SUBMIT_FAILED = 'Nộp bài thất bại',
  START_FAILED = 'Không bắt đầu được bài làm',
  DRAFT_SAVE_FAILED = 'Không lưu được câu trả lời — kiểm tra kết nối mạng',
  FEEDBACK_LABEL = 'Nhận xét của giáo viên',
  FEEDBACK_PLACEHOLDER = 'Nhập nhận xét cho câu trả lời tự luận…',
  FEEDBACK_REQUIRED = 'Nhập nhận xét trước khi lưu',
  SAVE_FEEDBACK = 'Lưu nhận xét',
  FEEDBACK_SAVED = 'Đã lưu nhận xét',
  FEEDBACK_SAVE_FAILED = 'Lưu nhận xét thất bại',
  GRADED_TAG = 'Đã chấm',
  NOT_GRADED_TAG = 'Chưa chấm',
  CONFLICT_TITLE = 'Bài tập đã được cập nhật bởi người khác',
  CONFLICT_CONTENT = 'Một người khác vừa lưu thay đổi cho bài tập này khi bạn đang sửa. Tải lại trang để lấy bản mới nhất — thay đổi bạn chưa lưu trên trang này sẽ mất nếu tải lại.',
  CONFLICT_RELOAD = 'Tải lại trang',
  CONFLICT_LATER = 'Để sau',
  UNSAVED_TITLE = 'Rời trang soạn bài tập?',
  UNSAVED_CONTENT = 'Thay đổi bạn chưa lưu sẽ mất nếu rời trang.',
  UNSAVED_LEAVE = 'Rời trang',
  UNSAVED_STAY = 'Ở lại',
  PUBLISH_CONFIRM_TITLE = 'Mở bài tập cho học viên?',
  PUBLISH_CONFIRM_CONTENT = 'Toàn bộ học viên trong lớp sẽ nhận thông báo ngay khi lưu.',
  PUBLISH_CONFIRM_OK = 'Mở và lưu',
  PUBLISH_CONFIRM_CANCEL = 'Hủy',
}

export enum LectureUiMessage {
  CREATED = 'Đã thêm bài giảng',
  UPDATED = 'Đã cập nhật bài giảng',
  DELETED = 'Đã xóa bài giảng',
  SAVE_FAILED = 'Lưu bài giảng thất bại',
  DELETE_FAILED = 'Xóa bài giảng thất bại',
  IMAGE_ADDED = 'Đã thêm ảnh',
  UPLOAD_FAILED = 'Upload thất bại',
  INVALID_URL = 'URL không hợp lệ',
  TITLE_REQUIRED = 'Nhập tiêu đề bài giảng',
  DISCARDED_CHANGES = 'Đã hủy — thay đổi chưa lưu vào bài giảng đã đăng',
  FORBIDDEN = 'Bạn không có quyền thực hiện thao tác này',
  NOT_FOUND = 'Không tìm thấy bài giảng',
}
