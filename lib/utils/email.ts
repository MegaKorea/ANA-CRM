import { EmailFormat } from '@/constants/email';

export function validateEmailFormat(email: string): boolean {
  return EmailFormat.PATTERN.test(email);
}
