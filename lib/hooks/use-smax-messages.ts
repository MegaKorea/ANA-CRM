import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/axios';
import { SmaxApiPath, SmaxQueryKey } from '@/constants/smax';
import type { SmaxConversationResult, SmaxThreadRef } from '@/lib/smax/types';

export function useSmaxMessages(thread: SmaxThreadRef | null, open: boolean) {
  return useQuery({
    queryKey: [
      SmaxQueryKey.MESSAGES,
      thread?.pageId,
      thread?.facebookId,
      thread?.bizAlias,
    ],
    enabled: open && !!thread,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    retry: 1,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<SmaxConversationResult> => {
      if (!thread) {
        throw new Error('Missing Smax thread');
      }

      const params = new URLSearchParams({
        pageId: thread.pageId,
        facebookId: thread.facebookId,
        bizAlias: thread.bizAlias,
      });

      return api.get<SmaxConversationResult>(
        `${SmaxApiPath.MESSAGES}?${params.toString()}`
      );
    },
  });
}
