export const PUBLIC_ROUTES = ['/login', '/api/auth/login', '/404', '/lead-form', '/api/lead-form', '/api/push/run', '/sw.js'] as const;

export const AUTH_ROUTES = ['/login'] as const;

export const DEFAULT_AUTHENTICATED_ROUTE = '/reports';

export const ApiBasePath = {
  DEFAULT: '/api',
} as const;