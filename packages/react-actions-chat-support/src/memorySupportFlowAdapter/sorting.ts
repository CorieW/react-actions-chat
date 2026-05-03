import type {
  SupportLiveChatSession,
  SupportTicket,
} from '../supportFlowTypes';

/**
 * Shared ticket priority rank value used by this module.
 */
const TICKET_PRIORITY_RANK: Record<SupportTicket['priority'], number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

/**
 * Sorts by updated at desc.
 *
 * @param left - Left value in the comparison.
 * @param right - Right value in the comparison.
 */
export function sortByUpdatedAtDesc(
  left: Pick<SupportTicket, 'updatedAt'>,
  right: Pick<SupportTicket, 'updatedAt'>
): number {
  return right.updatedAt.getTime() - left.updatedAt.getTime();
}

/**
 * Sorts higher-priority tickets before lower-priority tickets.
 *
 * @param left - Left value in the comparison.
 * @param right - Right value in the comparison.
 */
function sortTicketPriorityDesc(
  left: SupportTicket,
  right: SupportTicket
): number {
  return (
    TICKET_PRIORITY_RANK[left.priority] - TICKET_PRIORITY_RANK[right.priority]
  );
}

/**
 * Sorts queue tickets.
 *
 * @param left - Left value in the comparison.
 * @param right - Right value in the comparison.
 */
export function sortQueueTickets(
  left: SupportTicket,
  right: SupportTicket
): number {
  const leftIsUntaken = !left.assignedTo;
  const rightIsUntaken = !right.assignedTo;

  if (leftIsUntaken !== rightIsUntaken) {
    return leftIsUntaken ? -1 : 1;
  }

  if (leftIsUntaken && rightIsUntaken) {
    return (
      sortTicketPriorityDesc(left, right) || sortByUpdatedAtDesc(left, right)
    );
  }

  return sortByUpdatedAtDesc(left, right);
}

/**
 * Sorts live chats by queue position.
 *
 * @param left - Left value in the comparison.
 * @param right - Right value in the comparison.
 */
export function sortLiveChatsByQueuePosition(
  left: SupportLiveChatSession,
  right: SupportLiveChatSession
): number {
  return (
    left.queuePosition - right.queuePosition ||
    left.createdAt.getTime() - right.createdAt.getTime()
  );
}

/**
 * Sorts live chats by recent activity.
 *
 * @param left - Left value in the comparison.
 * @param right - Right value in the comparison.
 */
export function sortLiveChatsByRecentActivity(
  left: SupportLiveChatSession,
  right: SupportLiveChatSession
): number {
  const rightTime = right.updatedAt ?? right.createdAt;
  const leftTime = left.updatedAt ?? left.createdAt;
  return rightTime.getTime() - leftTime.getTime();
}
