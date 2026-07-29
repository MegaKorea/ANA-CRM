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
  /** Primary avatar URL (smax_log.picture). */
  customerAvatar: string;
  /** Extra URLs to try if primary fails (e.g. facebook.picture). */
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
