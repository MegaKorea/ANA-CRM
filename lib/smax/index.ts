export { parseSmaxThreadRef, hasSmaxConversation } from '@/lib/smax/parse-smax-log';
export {
  fetchSmaxThreadMessages,
  fetchSmaxCustomerStatistics,
} from '@/lib/smax/smax.service';
export { mapSmaxMessagesPayload } from '@/lib/smax/map-messages';
export {
  mapSmaxCustomerStatistics,
  resolveSmaxRegisteredTotal,
} from '@/lib/smax/map-statistics';
export type {
  SmaxLog,
  SmaxThreadRef,
  SmaxChatMessage,
  SmaxConversationResult,
  SmaxMessageAttachment,
  SmaxCustomerStatistics,
  SmaxCustomerStatisticsRequest,
  SmaxStatisticsApiResponse,
} from '@/lib/smax/types';
