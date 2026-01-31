export const AuthApiPath = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
} as const;

export const AuthQueryKey = {
  LOGIN: 'auth-login',
  ME: 'auth-me',
} as const;

export const LoginFormMessage = {
  EMAIL_REQUIRED: 'Vui lòng nhập email',
  EMAIL_INVALID: 'Email không hợp lệ',
  PASSWORD_REQUIRED: 'Vui lòng nhập mật khẩu',
  EMAIL_PLACEHOLDER: 'Nhập email',
  PASSWORD_PLACEHOLDER: 'Nhập mật khẩu',
  LOGIN_SUCCESS: 'Đăng nhập thành công',
  LOGIN_FAILED: 'Đăng nhập thất bại',
  LOGIN_ERROR: 'Đã xảy ra lỗi khi đăng nhập',
} as const;

export const LogoutMessage = {
  SUCCESS: 'Đăng xuất thành công',
  ERROR: 'Đã xảy ra lỗi khi đăng xuất',
} as const;

export const LoginFormLabel = {
  EMAIL: 'Email',
  PASSWORD: 'Mật khẩu',
  SUBMIT: 'Đăng nhập',
} as const;
