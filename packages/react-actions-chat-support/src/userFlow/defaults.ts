import type { SupportUserFlowLabels } from './types';
import { DEFAULT_USER_LIVE_CHAT_LABELS } from './live-chat/defaults';
import { DEFAULT_USER_TICKET_LABELS } from './tickets/defaults';

export const DEFAULT_USER_LABELS: SupportUserFlowLabels = {
  ...DEFAULT_USER_TICKET_LABELS,
  ...DEFAULT_USER_LIVE_CHAT_LABELS,
  backToSupportOptions: 'Back to support options',
};
