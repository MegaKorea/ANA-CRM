export function formatViDateTime(value: string): string {
  return new Date(value).toLocaleString('vi-VN');
}
