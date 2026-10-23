/** "ĐANG CHĂM SÓC" → "Đang chăm sóc" */
export function toSentenceCase(text: string): string {
  const lower = text.trim().toLocaleLowerCase('vi-VN');
  return lower.charAt(0).toLocaleUpperCase('vi-VN') + lower.slice(1);
}
