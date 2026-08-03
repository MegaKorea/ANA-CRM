const TAG_LABELS: Record<string, string> = {
  'da-chot': 'Đã chốt',
  chot: 'Đã chốt',
  'da-coc': 'Đã cọc',
  'dat-lich-hen': 'Đặt lịch hẹn',
  sdt: 'SĐT',
  'sdt-da-co': 'SĐT (Đã có)',
  'sđt (đã cóp)': 'SĐT (Đã có)',
  'đã cóp sdt': 'Đã cóp SĐT',
  'tiem-nang': 'Tiềm năng',
  'cho-24h': 'Chờ-24h',
  'chờ-24h': 'Chờ-24h',
  'cham-zalo': 'Chăm Zalo',
  'cham-soc': 'Chăm sóc',
  'cham-soc-da': 'Chăm sóc da',
  'chăm sóc da': 'Chăm sóc da',
  'chua-phan-hoi': 'Chưa phản hồi',
  'chua-tiep-can': 'Chưa tiếp cận',
  'k-tra-loi': 'Không trả lời',
  rac: 'Rác',
  'goi-dau-ds': 'Gội đầu DS',
  spa: 'SPA',
  'chờ tl': 'CHỜ TL',
  'cho tl': 'CHỜ TL',
};

export function formatSmaxTagLabel(name: string): string {
  const trimmed = name.trim();
  return TAG_LABELS[trimmed.toLowerCase()] ?? trimmed;
}

export function smaxTagMergeKey(name: string): string {
  return formatSmaxTagLabel(name).toLowerCase();
}
