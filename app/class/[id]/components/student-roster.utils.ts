export const studentStatusMeta: Record<string, { label: string; color: string }> = {
  active: { label: 'Đang học', color: 'green' },
  withdrawn: { label: 'Đã rút', color: 'red' },
  completed: { label: 'Hoàn thành', color: 'blue' },
};

export function formatCurrency(val: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
}

const AVATAR_COLORS = ['#1677ff', '#52c41a', '#faad14', '#f5222d', '#fa8c16', '#13c2c2'];

export function nameToColor(name: string): string {
  let hash = 0;
  for (const c of name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? parts[parts.length - 1][0].toUpperCase()
    : (name[0]?.toUpperCase() ?? '?');
}

export const MASKED_CONTACT = '*********';

export function isOwnStudentRow(
  record: { login_email?: string; leads?: { email?: string; phone_number?: string } | null },
  userEmail: string | null | undefined,
): boolean {
  if (!userEmail) return false;
  const email = userEmail.toLowerCase();
  return (
    record.login_email?.toLowerCase() === email ||
    record.leads?.email?.toLowerCase() === email
  );
}
