import { PhoneCountryCode, PhoneFormat } from '@/constants/phone';

const PhonePrefix = {
  ZERO: '0',
  COUNTRY_CODE_WITHOUT_PLUS: '84',
  PLUS: '+',
} as const;

export function formatPhoneToE164(phone: string): string {
  const cleanedPhone = phone.trim().replace(/\s+/g, '');

  if (cleanedPhone.startsWith(PhoneCountryCode.VIETNAM)) {
    return cleanedPhone;
  }

  if (cleanedPhone.startsWith(PhonePrefix.ZERO)) {
    const phoneWithoutZero = cleanedPhone.substring(1);
    return `${PhoneCountryCode.VIETNAM}${phoneWithoutZero}`;
  }

  if (cleanedPhone.startsWith(PhonePrefix.COUNTRY_CODE_WITHOUT_PLUS)) {
    return `${PhonePrefix.PLUS}${cleanedPhone}`;
  }

  return `${PhoneCountryCode.VIETNAM}${cleanedPhone}`;
}

export function formatPhoneToLocal(phone: string): string {
  const e164Phone = formatPhoneToE164(phone);
  if (e164Phone.startsWith(PhoneCountryCode.VIETNAM)) {
    return `${PhonePrefix.ZERO}${e164Phone.substring(PhoneCountryCode.VIETNAM.length)}`;
  }
  return e164Phone;
}

export function validateE164Format(phone: string): boolean {
  return PhoneFormat.E164_PATTERN.test(phone);
}

/**
 * Subscriber digits only, so the same number compares equal no matter which format it
 * was stored in (0912345678, +84912345678, 84912345678, "0912 345 678").
 */
export function normalizePhoneDigits(phone: string | null | undefined): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.startsWith('84')) return digits.slice(2);
  return digits.replace(/^0/, '');
}
