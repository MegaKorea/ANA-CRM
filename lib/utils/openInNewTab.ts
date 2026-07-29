/**
 * Mở một URL ở tab mới một cách an toàn.
 *
 * - Luôn gắn `noopener,noreferrer` để tab mới không truy cập được `window.opener`
 *   (tránh reverse tabnabbing) và không rò rỉ referrer.
 * - Chỉ cho phép scheme http/https để chặn `javascript:` / `data:` URI từ dữ liệu bẩn.
 *
 * @returns `true` nếu đã mở, `false` nếu URL rỗng hoặc không hợp lệ.
 */
export function openInNewTab(url: string | null | undefined): boolean {
  if (!isSafeHttpUrl(url)) {
    return false;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

/**
 * Kiểm tra một chuỗi có phải URL http/https hợp lệ hay không.
 */
export function isSafeHttpUrl(url: string | null | undefined): url is string {
  const trimmed = url?.trim();
  if (!trimmed) {
    return false;
  }
  try {
    const { protocol } = new URL(trimmed);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}
