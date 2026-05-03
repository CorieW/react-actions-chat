import type { SupportTicket } from '../supportFlowTypes';

/**
 * Normalizes reference for consistent lookups.
 *
 * @param reference - Ticket reference to normalize or look up.
 */
export function normalizeReference(reference: string): string {
  return reference.trim().toUpperCase();
}

/**
 * Infers next ticket number from existing records.
 *
 * @param tickets - Support tickets to sort, paginate, or render.
 */
export function inferNextTicketNumber(
  tickets: readonly SupportTicket[]
): number {
  const nextFromTickets = tickets.reduce((highestNumber, ticket) => {
    const match = ticket.reference.match(/(\d+)$/);
    const ticketNumber = match ? Number(match[1]) : 0;
    return Math.max(highestNumber, ticketNumber);
  }, 999);

  return nextFromTickets + 1;
}

/**
 * Derives subject from available support data.
 *
 * @param summary - Support request summary used to derive a subject.
 */
export function deriveSubject(summary: string): string {
  const trimmedSummary = summary.trim();
  if (!trimmedSummary) {
    return 'General support request';
  }

  const firstSentence = trimmedSummary.split(/[.!?]/, 1)[0] ?? trimmedSummary;
  const condensed = firstSentence.trim();

  if (condensed.length <= 72) {
    return condensed;
  }

  return `${condensed.slice(0, 69).trimEnd()}...`;
}

/**
 * Creates a message ID.
 *
 * @param prefix - Text prefix used when generating the ID.
 * @param counter - Numeric counter used to build the ID.
 */
export function createMessageId(prefix: string, counter: number): string {
  return `${prefix}-${counter.toString().padStart(4, '0')}`;
}
