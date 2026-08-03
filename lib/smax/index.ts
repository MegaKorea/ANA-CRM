export { parseSmaxThreadRef, hasSmaxConversation } from '@/lib/smax/parse-smax-log';
export {
  fetchSmaxThreadMessages,
  fetchSmaxCustomerStatistics,
  fetchSmaxTagStatistics,
} from '@/lib/smax/smax.service';
export { mapSmaxMessagesPayload } from '@/lib/smax/map-messages';
export {
  mapSmaxCustomerStatistics,
  resolveSmaxRegisteredTotal,
} from '@/lib/smax/map-statistics';
export { mapSmaxTagStatistics } from '@/lib/smax/map-tags';
export { formatSmaxTagLabel } from '@/lib/smax/tag-labels';
export type {
  SmaxLog,
  SmaxThreadRef,
  SmaxChatMessage,
  SmaxConversationResult,
  SmaxMessageAttachment,
  SmaxCustomerStatistics,
  SmaxCustomerStatisticsRequest,
  SmaxStatisticsApiResponse,
  SmaxTagStatistics,
  SmaxTagStatisticsApiResponse,
  SmaxTagTotal,
} from '@/lib/smax/types';
