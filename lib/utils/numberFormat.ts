const viNumberFormatter = new Intl.NumberFormat('vi-VN');
const viVndCurrencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export function formatNumberVi(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '';
  }
  return viNumberFormatter.format(value);
}

export function formatCurrencyVnd(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '';
  }
  return viVndCurrencyFormatter.format(value);
}

/**
 * For Ant Design InputNumber formatter/parser for integer values (e.g. VND).
 * - formatter: inserts group separators for readability
 * - parser: strips non-digits and returns a number
 */
export function formatIntegerInput(value?: string | number): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  const digitsOnly = str.replace(/[^\d]/g, '');
  if (!digitsOnly) return '';
  return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function parseIntegerInput(value?: string): number {
  if (!value) return 0;
  const digitsOnly = value.replace(/[^\d]/g, '');
  return digitsOnly ? Number(digitsOnly) : 0;
}

