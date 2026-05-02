import type {
  SupportLiveChatSession,
  SupportTicket,
} from '../supportFlowTypes';

const TICKET_PRIORITY_RANK: Record<SupportTicket['priority'], number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

export function sortByUpdatedAtDesc(
  left: Pick<SupportTicket, 'updatedAt'>,
  right: Pick<SupportTicket, 'updatedAt'>
): number {
  return right.updatedAt.getTime() - left.updatedAt.getTime();
}

function sortTicketPriorityDesc(
  left: SupportTicket,
  right: SupportTicket
): number {
  return (
    TICKET_PRIORITY_RANK[left.priority] - TICKET_PRIORITY_RANK[right.priority]
  );
}

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

export function sortLiveChatsByQueuePosition(
  left: SupportLiveChatSession,
  right: SupportLiveChatSession
): number {
  return (
    left.queuePosition - right.queuePosition ||
    left.createdAt.getTime() - right.createdAt.getTime()
  );
}

export function sortLiveChatsByRecentActivity(
  left: SupportLiveChatSession,
  right: SupportLiveChatSession
): number {
  const rightTime = right.updatedAt ?? right.createdAt;
  const leftTime = left.updatedAt ?? left.createdAt;
  return rightTime.getTime() - leftTime.getTime();
}
