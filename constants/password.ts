export const PasswordCharacterSet = {
  UPPERCASE: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  LOWERCASE: 'abcdefghijklmnopqrstuvwxyz',
  DIGITS: '0123456789',
  SYMBOLS: '!@#$%^&*()-_=+[]{}|;:,.<>?',
} as const;



export const PasswordPolicyNumber = {
  MIN_LENGTH: 12,
  MIN_UPPERCASE: 1,
  MIN_LOWERCASE: 1,
  MIN_DIGITS: 1,
  MIN_SYMBOLS: 1,
} as const;
