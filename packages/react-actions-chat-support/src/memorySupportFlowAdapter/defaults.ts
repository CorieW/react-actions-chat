/**
 * Default open ticket statuses used when callers do not override it.
 */
export const DEFAULT_OPEN_TICKET_STATUSES = [
  'new',
  'open',
  'pending-customer',
  'pending-internal',
] as const;

/**
 * Default open live chat statuses used when callers do not override it.
 */
export const DEFAULT_OPEN_LIVE_CHAT_STATUSES = ['queued', 'active'] as const;
