export const PhoneCountryCode = {
  VIETNAM: '+84',
} as const;

export const PhoneFormat = {
  E164_PATTERN: /^\+84[1-9]\d{8,9}$/,
  VIETNAM_PATTERN: /^(0[3|5|7|8|9])+([0-9]{8})$/,
} as const;
