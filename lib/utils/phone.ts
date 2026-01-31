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

export function validateE164Format(phone: string): boolean {
  return PhoneFormat.E164_PATTERN.test(phone);
}
