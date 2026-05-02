import type { SupportTicket } from '../supportFlowTypes';

export function normalizeReference(reference: string): string {
  return reference.trim().toUpperCase();
}

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

export function createMessageId(prefix: string, counter: number): string {
  return `${prefix}-${counter.toString().padStart(4, '0')}`;
}
