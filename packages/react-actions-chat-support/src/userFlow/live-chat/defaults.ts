import type { SupportUserFlowLabels } from '../types';

type UserLiveChatLabels = Pick<
  SupportUserFlowLabels,
  | 'startLiveChat'
  | 'refreshChat'
  | 'endLiveChat'
  | 'liveChatMessagePlaceholder'
  | 'liveChatMessageDescription'
  | 'liveChatWaitingPlaceholder'
  | 'liveChatWaitingDescription'
>;

export const DEFAULT_USER_LIVE_CHAT_LABELS: UserLiveChatLabels = {
  startLiveChat: 'Start live chat',
  refreshChat: 'Refresh chat',
  endLiveChat: 'End live chat',
  liveChatMessagePlaceholder: 'Type a live chat message...',
  liveChatMessageDescription: 'Live chat is active.',
  liveChatWaitingPlaceholder: 'Waiting for a support agent to join...',
  liveChatWaitingDescription: 'Live chat is waiting for an agent.',
};
