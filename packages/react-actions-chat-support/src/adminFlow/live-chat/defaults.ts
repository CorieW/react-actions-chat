import type { SupportAdminFlowLabels } from '../types';

/**
 * Defaultable label contract for the admin live chat.
 */
type AdminLiveChatLabels = Pick<
  SupportAdminFlowLabels,
  | 'viewLiveChatQueue'
  | 'previousLiveChats'
  | 'nextLiveChats'
  | 'backToLiveChatQueue'
  | 'refreshLiveChats'
  | 'refreshChat'
  | 'endLiveChat'
  | 'joinLiveChat'
  | 'leaveLiveChat'
  | 'liveChatReplyPlaceholder'
  | 'liveChatReplyDescription'
>;

/**
 * Default admin live chat labels used when callers do not override it.
 */
export const DEFAULT_ADMIN_LIVE_CHAT_LABELS: AdminLiveChatLabels = {
  viewLiveChatQueue: 'View live chat queue',
  previousLiveChats: 'Previous live chats',
  nextLiveChats: 'Next live chats',
  backToLiveChatQueue: 'Back to live chat queue',
  refreshLiveChats: 'Refresh live chats',
  refreshChat: 'Refresh chat',
  endLiveChat: 'End live chat',
  joinLiveChat: 'Join live chat',
  leaveLiveChat: 'Leave live chat',
  liveChatReplyPlaceholder: 'Type a live chat reply...',
  liveChatReplyDescription: session => `Live chat ${session.id} is active.`,
};
