import type { SupportAdminFlowLabels } from './types';
import { DEFAULT_ADMIN_LIVE_CHAT_LABELS } from './live-chat/defaults';
import {
  DEFAULT_ADMIN_TICKET_LABELS,
  DEFAULT_PRIORITY_ORDER,
} from './tickets/defaults';

export { DEFAULT_PRIORITY_ORDER };

/**
 * Default admin labels used when callers do not override it.
 */
export const DEFAULT_ADMIN_LABELS: SupportAdminFlowLabels = {
  ...DEFAULT_ADMIN_TICKET_LABELS,
  ...DEFAULT_ADMIN_LIVE_CHAT_LABELS,
  backToAdminOptions: 'Back to admin options',
};
