/**
 * Thông số vòng đời mã QR điểm danh.
 *
 * Để ở đây (không để trong service) vì cả phía server lẫn màn hình giáo viên đều
 * cần: import từ `class_session.service` sẽ kéo theo `createAdminClient` —
 * tức khoá service-role — vào bundle trình duyệt.
 *
 * QR_ROTATE_INTERVAL_MS phải nhỏ hơn QR_TOKEN_TTL_MS để lần xoay kế tiếp luôn
 * kịp trước khi mã cũ chết, tránh khoảng trống học viên quét phải mã hết hạn.
 */
export const QR_TOKEN_TTL_MS = 45 * 1000;
export const QR_ROTATE_INTERVAL_MS = 20 * 1000;
