export { parseSmaxThreadRef, hasSmaxConversation } from '@/lib/smax/parse-smax-log';
export { fetchSmaxThreadMessages } from '@/lib/smax/smax.service';
export { mapSmaxMessagesPayload } from '@/lib/smax/map-messages';
export type {
  SmaxLog,
  SmaxThreadRef,
  SmaxChatMessage,
  SmaxConversationResult,
  SmaxMessageAttachment,
} from '@/lib/smax/types';
