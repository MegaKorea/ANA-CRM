export interface SmaxFacebookRef {
  id?: string;
  name?: string;
  page_id?: string;
  page_name?: string;
  picture?: string;
  conversation_id?: string;
  conversation_link?: string;
}

export interface SmaxLog {
  id?: string;
  name?: string;
  picture?: string;
  profile_name?: string;
  page_pid?: string;
  thread_tid?: string;
  biz_alias?: string;
  platform?: string;
  facebook?: SmaxFacebookRef;
  page_id?: string;
  [key: string]: unknown;
}

export interface SmaxThreadRef {
  pageId: string;
  facebookId: string;
  bizAlias: string;
  customerName: string;
  customerAvatar: string;
  customerAvatarFallbacks: string[];
  pageName: string;
}

export interface SmaxMessageAttachment {
  id: string;
  type?: string;
  url?: string;
  name?: string;
  mime_type?: string;
  size?: number;
  preview_url?: string;
}

export interface SmaxChatMessage {
  id: string;
  text?: string;
  createdAt?: string;
  isFromPage: boolean;
  isAi: boolean;
  senderName?: string;
  senderAvatar?: string;
  attachments: SmaxMessageAttachment[];
}

export interface SmaxConversationResult {
  messages: SmaxChatMessage[];
  thread: SmaxThreadRef;
}

export interface SmaxCustomerStatisticsRequest {
  from: string;
  to: string;
  apply_all: boolean;
  key_time: string;
  page_pids: string[];
  target: string;
  type: string;
  tag_aliases: string[];
  top: number;
}

export interface SmaxCustomerStatistics {
  messages: number;
  newCustomers: number;
  data: number;
  orders: number;
  calendars: SmaxStatisticsCalendarDay[];
  raw: unknown;
}

export interface SmaxStatisticsCalendarDay {
  date: string;
  messages: number;
  interactions: number;
  leads: number;
  orders: number;
}

export interface SmaxStatisticsApiResponse {
  messages: number;
  newCustomers: number;
  data: number;
  orders: number;
  calendars: SmaxStatisticsCalendarDay[];
  source: 'smax';
}

export interface SmaxTagTotal {
  name: string;
  add: number;
  curAdd: number;
  remove: number;
  net: number;
}

export interface SmaxTagStatistics {
  tags: SmaxTagTotal[];
  totalNet: number;
}

export interface SmaxTagStatisticsApiResponse {
  tags: SmaxTagTotal[];
  totalNet: number;
  source: 'smax';
}

export interface SmaxSupporterRow {
  id: string;
  name: string;
  avatar: string | null;
  messages: number;
  conversations: number;
  replyTimeSec: number;
}

export interface SmaxSupporterStatistics {
  rows: SmaxSupporterRow[];
}

export interface SmaxSupporterStatisticsApiResponse {
  rows: SmaxSupporterRow[];
  source: 'smax';
}

export interface SmaxPlatformPerformance {
  key: string;
  label: string;
  messages: number;
  data: number;
  avgReplyTimeSec: number;
}

export interface SmaxMessagingPerformance {
  totalMessages: number;
  totalData: number;
  avgReplyTimeSec: number;
  platforms: SmaxPlatformPerformance[];
}

export interface SmaxMessagingPerformanceApiResponse
  extends SmaxMessagingPerformance {
  source: 'smax';
}
