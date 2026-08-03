export const SMAX_DEFAULT_BIZ_ALIAS = 'ana-beauty-academy';
export const SMAX_DEFAULT_API_BASE_URL = 'https://api.smax.ai';
export const SMAX_MESSAGES_LIMIT = 30;

export const SMAX_DEFAULT_PAGE_PIDS = ['fb1181323041975922'] as const;

export const SMAX_TAGS_TOP = 10;

export const SmaxApiPath = {
  MESSAGES: '/smax/messages',
  STATISTICS: '/smax/statistics',
  TAGS: '/smax/tags',
} as const;

export const SmaxQueryKey = {
  MESSAGES: 'smax-messages',
  STATISTICS: 'smax-statistics',
  TAGS: 'smax-tags',
} as const;

export const SmaxCustomerStatType = {
  MESSAGE_AND_COMMENT: 'message_and_comment',
} as const;

export const SmaxCustomerStatTarget = {
  CUSTOMER_AND_PAGE: 'customer_and_page',
} as const;
