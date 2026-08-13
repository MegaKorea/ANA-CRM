export const SMAX_DEFAULT_BIZ_ALIAS = 'ana-beauty-academy';
export const SMAX_DEFAULT_API_BASE_URL = 'https://api.smax.ai';
export const SMAX_MESSAGES_LIMIT = 30;

export const SMAX_DEFAULT_PAGE_PIDS = [
  'zlw555884932030283040',
  'fb1181323041975922',
] as const;

export const SMAX_TAGS_TOP = 10;
export const SMAX_SUPPORTERS_TOP = 10;

export const SmaxApiPath = {
  MESSAGES: '/smax/messages',
  STATISTICS: '/smax/statistics',
  TAGS: '/smax/tags',
  SUPPORTERS: '/smax/supporters',
  MESSAGING_PERFORMANCE: '/smax/messaging-performance',
} as const;

export const SmaxQueryKey = {
  MESSAGES: 'smax-messages',
  STATISTICS: 'smax-statistics',
  TAGS: 'smax-tags',
  SUPPORTERS: 'smax-supporters',
  MESSAGING_PERFORMANCE: 'smax-messaging-performance',
} as const;

export const SmaxCustomerStatType = {
  MESSAGE_AND_COMMENT: 'message_and_comment',
} as const;

export const SmaxSupporterStatType = {
  MESSAGE: 'message',
  CONVERSATION: 'conversation',
  TIME_REPLY: 'time_reply',
} as const;

export const SmaxCustomerStatTarget = {
  CUSTOMER_AND_PAGE: 'customer_and_page',
} as const;

export const SMAX_SUPPORTER_DIRECTORY: Readonly<Record<string, string>> = {
  '6a02f1b69b2964e2bf208063': 'Hạnh Nguyên',
  '6a03e25a166040269a56c5f1': 'CSKH ANA',
  '6a03e6bb02b7dea65f3991da': 'Trang Kiều',
};
