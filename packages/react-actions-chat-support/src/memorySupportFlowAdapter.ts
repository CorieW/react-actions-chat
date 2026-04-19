import type {
  AppendSupportTicketMessageInput,
  CreateSupportTicketInput,
  InMemorySupportFlowAdapterOptions,
  StartSupportLiveChatInput,
  SupportFlowAdapter,
  SupportKnowledgeBaseArticle,
  SupportLiveChatSession,
  SupportQueueFilter,
  SupportTicket,
  SupportTicketMessage,
  SupportUserIdentity,
  UpdateSupportTicketInput,
} from './supportFlowTypes';

function cloneIdentity(
  identity: SupportUserIdentity | undefined
): SupportUserIdentity | undefined {
  if (!identity) {
    return undefined;
  }

  return {
    ...identity,
  };
}

function cloneMessage(message: SupportTicketMessage): SupportTicketMessage {
  return {
    ...message,
    createdAt: new Date(message.createdAt),
  };
}

function cloneTicket(ticket: SupportTicket): SupportTicket {
  return {
    ...ticket,
    customer: {
      ...ticket.customer,
    },
    createdAt: new Date(ticket.createdAt),
    updatedAt: new Date(ticket.updatedAt),
    messages: ticket.messages.map(cloneMessage),
    ...(ticket.tags ? { tags: [...ticket.tags] } : {}),
  };
}

function cloneArticle(
  article: SupportKnowledgeBaseArticle
): SupportKnowledgeBaseArticle {
  return {
    ...article,
    ...(article.keywords ? { keywords: [...article.keywords] } : {}),
  };
}

function cloneLiveChat(
  session: SupportLiveChatSession
): SupportLiveChatSession {
  return {
    ...session,
    createdAt: new Date(session.createdAt),
    ...(session.customer ? { customer: { ...session.customer } } : {}),
    ...(session.agent ? { agent: { ...session.agent } } : {}),
  };
}

function normalizeReference(reference: string): string {
  return reference.trim().toUpperCase();
}

function inferNextTicketNumber(tickets: readonly SupportTicket[]): number {
  const nextFromTickets = tickets.reduce((highestNumber, ticket) => {
    const match = ticket.reference.match(/(\d+)$/);
    const ticketNumber = match ? Number(match[1]) : 0;
    return Math.max(highestNumber, ticketNumber);
  }, 999);

  return nextFromTickets + 1;
}

function deriveSubject(summary: string): string {
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

function matchesCustomer(
  ticket: SupportTicket,
  customer: SupportUserIdentity
): boolean {
  if (customer.id && ticket.customer.id && customer.id === ticket.customer.id) {
    return true;
  }

  if (
    customer.email &&
    ticket.customer.email &&
    customer.email.toLowerCase() === ticket.customer.email.toLowerCase()
  ) {
    return true;
  }

  return false;
}

function createMessageId(prefix: string, counter: number): string {
  return `${prefix}-${counter.toString().padStart(4, '0')}`;
}

export const DEFAULT_SUPPORT_KNOWLEDGE_BASE_ARTICLES: readonly SupportKnowledgeBaseArticle[] =
  [
    {
      id: 'billing-renewals',
      title: 'Billing and renewals',
      summary:
        'Understand invoice timing, failed payments, and renewal reminders.',
      body: 'Invoices are generated immediately after a successful payment. Renewal reminders go out three days before the next billing date, and failed payments automatically retry.',
      keywords: ['billing', 'invoice', 'renewal', 'payment', 'charge'],
    },
    {
      id: 'refund-policy',
      title: 'Refund and cancellation policy',
      summary:
        'Learn which purchases are refundable and how long approvals take.',
      body: 'Unused subscriptions can be refunded within 30 days. Approved refunds are usually processed in two business days, and banks may take another five to ten days to post the credit.',
      keywords: ['refund', 'return', 'cancel', 'cancellation'],
    },
    {
      id: 'live-chat-handoff',
      title: 'Escalating to live chat',
      summary:
        'See when live chat is available and what details help the handoff.',
      body: 'Live chat is best for urgent blockers and account-access problems. Include the impact, deadline, and any recent troubleshooting so the handoff is faster.',
      keywords: ['live chat', 'agent', 'handoff', 'escalation', 'urgent'],
    },
  ];

export function createInMemorySupportFlowAdapter(
  options: InMemorySupportFlowAdapterOptions = {}
): SupportFlowAdapter {
  let tickets = (options.tickets ?? []).map(cloneTicket);
  const knowledgeBaseArticles = (
    options.knowledgeBaseArticles ?? DEFAULT_SUPPORT_KNOWLEDGE_BASE_ARTICLES
  ).map(cloneArticle);
  let liveChats = (options.liveChats ?? []).map(cloneLiveChat);
  let nextTicketNumber =
    options.nextTicketNumber ?? inferNextTicketNumber(tickets);
  let nextMessageNumber = tickets.reduce((count, ticket) => {
    return count + ticket.messages.length;
  }, 1);
  let nextLiveChatNumber = liveChats.length + 1;

  function getTicketIndex(reference: string): number {
    const normalizedReference = normalizeReference(reference);
    return tickets.findIndex(
      ticket => normalizeReference(ticket.reference) === normalizedReference
    );
  }

  function getRequiredTicket(reference: string): SupportTicket {
    const ticketIndex = getTicketIndex(reference);
    const ticket = ticketIndex >= 0 ? tickets[ticketIndex] : undefined;

    if (!ticket) {
      throw new Error(
        `Support ticket ${normalizeReference(reference)} not found`
      );
    }

    return ticket;
  }

  function saveTicket(nextTicket: SupportTicket): SupportTicket {
    const ticketIndex = getTicketIndex(nextTicket.reference);

    if (ticketIndex >= 0) {
      tickets = tickets.map((ticket, index) => {
        return index === ticketIndex ? nextTicket : ticket;
      });
    } else {
      tickets = [nextTicket, ...tickets];
    }

    return cloneTicket(nextTicket);
  }

  return {
    createTicket(input: CreateSupportTicketInput): SupportTicket {
      const now = new Date();
      const reference = `SUP-${nextTicketNumber.toString().padStart(4, '0')}`;
      nextTicketNumber += 1;
      const initialMessage: SupportTicketMessage = {
        id: createMessageId('ticket-message', nextMessageNumber),
        author: 'customer',
        authorLabel: input.customer.name ?? input.customer.email,
        body: input.summary.trim(),
        createdAt: now,
      };
      nextMessageNumber += 1;
      const nextTicket: SupportTicket = {
        reference,
        subject: input.subject?.trim() || deriveSubject(input.summary),
        summary: input.summary.trim(),
        customer: {
          ...input.customer,
        },
        status: 'new',
        priority: input.priority ?? 'normal',
        liveChatOffered: false,
        createdAt: now,
        updatedAt: now,
        messages: [initialMessage],
        ...(input.tags ? { tags: [...input.tags] } : {}),
      };

      return saveTicket(nextTicket);
    },

    getTicketByReference(reference: string): SupportTicket | null {
      const ticketIndex = getTicketIndex(reference);
      const ticket = ticketIndex >= 0 ? tickets[ticketIndex] : undefined;
      return ticket ? cloneTicket(ticket) : null;
    },

    listCustomerTickets(
      customer: SupportUserIdentity
    ): readonly SupportTicket[] {
      return tickets
        .filter(ticket => matchesCustomer(ticket, customer))
        .sort((left, right) => {
          return right.updatedAt.getTime() - left.updatedAt.getTime();
        })
        .map(cloneTicket);
    },

    listQueue(filter?: SupportQueueFilter): readonly SupportTicket[] {
      const allowedStatuses = filter?.statuses ?? [
        'new',
        'open',
        'pending-customer',
        'pending-internal',
      ];

      return tickets
        .filter(ticket => allowedStatuses.includes(ticket.status))
        .filter(ticket => {
          if (!filter?.assignedTo) {
            return true;
          }

          return ticket.assignedTo === filter.assignedTo;
        })
        .sort((left, right) => {
          return right.updatedAt.getTime() - left.updatedAt.getTime();
        })
        .map(cloneTicket);
    },

    updateTicket(input: UpdateSupportTicketInput): SupportTicket {
      const currentTicket = getRequiredTicket(input.reference);
      const nextTicket: SupportTicket = {
        ...currentTicket,
        ...(input.status ? { status: input.status } : {}),
        ...(input.priority ? { priority: input.priority } : {}),
        ...(input.assignedTo !== undefined
          ? input.assignedTo === null
            ? { assignedTo: undefined }
            : { assignedTo: input.assignedTo }
          : {}),
        ...(input.liveChatOffered !== undefined
          ? { liveChatOffered: input.liveChatOffered }
          : {}),
        updatedAt: new Date(),
      };

      return saveTicket(nextTicket);
    },

    appendTicketMessage(input: AppendSupportTicketMessageInput): SupportTicket {
      const currentTicket = getRequiredTicket(input.reference);
      const message: SupportTicketMessage = {
        id: createMessageId('ticket-message', nextMessageNumber),
        author: input.author,
        body: input.body.trim(),
        createdAt: new Date(),
        ...(input.authorLabel ? { authorLabel: input.authorLabel } : {}),
      };
      nextMessageNumber += 1;
      const nextTicket: SupportTicket = {
        ...currentTicket,
        updatedAt: message.createdAt,
        messages: [...currentTicket.messages, message],
      };

      return saveTicket(nextTicket);
    },

    searchKnowledgeBase(query: string): readonly SupportKnowledgeBaseArticle[] {
      const normalizedQuery = query.trim().toLowerCase();
      if (!normalizedQuery) {
        return [];
      }

      return knowledgeBaseArticles
        .filter(article => {
          const haystack = [
            article.title,
            article.summary,
            article.body ?? '',
            ...(article.keywords ?? []),
          ]
            .join(' ')
            .toLowerCase();

          return normalizedQuery
            .split(/\s+/)
            .some(queryTerm => haystack.includes(queryTerm));
        })
        .map(cloneArticle);
    },

    startLiveChat(input: StartSupportLiveChatInput): SupportLiveChatSession {
      const now = new Date();
      const ticketReference = input.ticketReference
        ? normalizeReference(input.ticketReference)
        : undefined;
      const session: SupportLiveChatSession = {
        id: `chat-${nextLiveChatNumber.toString().padStart(4, '0')}`,
        summary: input.summary.trim(),
        requestedBy: input.requestedBy,
        queuePosition: liveChats.length + 1,
        estimatedWaitMinutes: 2 + liveChats.length * 3,
        status: 'queued',
        createdAt: now,
        ...(ticketReference ? { ticketReference } : {}),
        ...(cloneIdentity(input.customer)
          ? { customer: cloneIdentity(input.customer) }
          : {}),
        ...(input.agent ? { agent: { ...input.agent } } : {}),
      };
      nextLiveChatNumber += 1;
      liveChats = [session, ...liveChats];

      if (ticketReference) {
        const currentTicket = getRequiredTicket(ticketReference);
        void saveTicket({
          ...currentTicket,
          liveChatOffered: true,
          updatedAt: now,
        });
      }

      return cloneLiveChat(session);
    },
  };
}
