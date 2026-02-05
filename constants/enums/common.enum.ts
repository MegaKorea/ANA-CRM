export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}

export enum NodeEnv {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
  TEST = 'test',
}

export enum ValidationPattern {
  UUID = '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
}

export enum ParseIntBase {
  DECIMAL = 10,
}

export enum AuthMessage {
  INVALID_CREDENTIALS = 'Invalid login credentials',
}

export enum RoleId {
  EXCLUDED = 4,
}

export enum PageTransitionDelay {
  DEFAULT = 500,
}

export enum DateFormat {
  ISO_DATE = 'YYYY-MM-DD',
}

export enum HttpClientTimeout {
  DEFAULT = 30000,
}

export enum DateLocale {
  VIET_NAM = 'vi-VN',
}