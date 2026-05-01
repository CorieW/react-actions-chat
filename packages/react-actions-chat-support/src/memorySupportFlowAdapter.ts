import type {
  AppendSupportLiveChatMessageInput,
  AppendSupportTicketMessageInput,
  CreateSupportTicketInput,
  InMemorySupportFlowAdapterOptions,
  InMemorySupportLiveChatIdContext,
  InMemorySupportLiveChatMessageIdContext,
  InMemorySupportLiveChatQueueContext,
  InMemorySupportTicketMessageIdContext,
  InMemorySupportTicketReferenceContext,
  StartSupportLiveChatInput,
  SupportFlowAdapter,
  SupportLiveChatMessage,
  SupportLiveChatQueueFilter,
  SupportLiveChatSession,
  SupportQueueFilter,
  SupportTicket,
  SupportTicketMessage,
  SupportUserIdentity,
  UpdateSupportLiveChatInput,
  UpdateSupportTicketInput,
} from './supportFlowTypes';

const DEFAULT_OPEN_TICKET_STATUSES = [
  'new',
  'open',
  'pending-customer',
  'pending-internal',
] as const;

const DEFAULT_OPEN_LIVE_CHAT_STATUSES = ['queued', 'active'] as const;

const TICKET_PRIORITY_RANK: Record<SupportTicket['priority'], number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

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

function cloneLiveChatMessage(
  message: SupportLiveChatMessage
): SupportLiveChatMessage {
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

function cloneLiveChat(
  session: SupportLiveChatSession
): SupportLiveChatSession {
  return {
    ...session,
    createdAt: new Date(session.createdAt),
    ...(session.updatedAt ? { updatedAt: new Date(session.updatedAt) } : {}),
    ...(session.customer ? { customer: { ...session.customer } } : {}),
    ...(session.agent ? { agent: { ...session.agent } } : {}),
    ...(session.messages
      ? { messages: session.messages.map(cloneLiveChatMessage) }
      : {}),
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

function matchesIdentity(
  candidate: SupportUserIdentity,
  customer: SupportUserIdentity
): boolean {
  if (customer.id && candidate.id && customer.id === candidate.id) {
    return true;
  }

  if (
    customer.email &&
    candidate.email &&
    customer.email.toLowerCase() === candidate.email.toLowerCase()
  ) {
    return true;
  }

  return false;
}

function createMessageId(prefix: string, counter: number): string {
  return `${prefix}-${counter.toString().padStart(4, '0')}`;
}

function sortByUpdatedAtDesc(
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

function sortQueueTickets(left: SupportTicket, right: SupportTicket): number {
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

function sortLiveChatsByQueuePosition(
  left: SupportLiveChatSession,
  right: SupportLiveChatSession
): number {
  return (
    left.queuePosition - right.queuePosition ||
    left.createdAt.getTime() - right.createdAt.getTime()
  );
}

function sortLiveChatsByRecentActivity(
  left: SupportLiveChatSession,
  right: SupportLiveChatSession
): number {
  const rightTime = right.updatedAt ?? right.createdAt;
  const leftTime = left.updatedAt ?? left.createdAt;
  return rightTime.getTime() - leftTime.getTime();
}

export function createInMemorySupportFlowAdapter(
  options: InMemorySupportFlowAdapterOptions = {}
): SupportFlowAdapter {
  let tickets = (options.tickets ?? []).map(cloneTicket);
  let liveChats = (options.liveChats ?? []).map(cloneLiveChat);
  let nextTicketNumber =
    options.nextTicketNumber ?? inferNextTicketNumber(tickets);
  let nextMessageNumber =
    options.nextTicketMessageNumber ??
    tickets.reduce((count, ticket) => {
      return count + ticket.messages.length;
    }, 1);
  let nextLiveChatMessageNumber =
    options.nextLiveChatMessageNumber ??
    liveChats.reduce((count, session) => {
      return count + (session.messages?.length ?? 0);
    }, 1);
  let nextLiveChatNumber = options.nextLiveChatNumber ?? liveChats.length + 1;

  function getNow(): Date {
    return new Date(options.now?.() ?? Date.now());
  }

  function getTicketReference(input: CreateSupportTicketInput): string {
    const context: InMemorySupportTicketReferenceContext = {
      input,
      nextTicketNumber,
      tickets: tickets.map(cloneTicket),
    };

    return (
      options.createTicketReference?.(context) ??
      `SUP-${nextTicketNumber.toString().padStart(4, '0')}`
    );
  }

  function getTicketSubject(input: CreateSupportTicketInput): string {
    return (
      input.subject?.trim() ||
      options.createTicketSubject?.({ input }) ||
      deriveSubject(input.summary)
    );
  }

  function getTicketMessageId(
    context: InMemorySupportTicketMessageIdContext
  ): string {
    return (
      options.createTicketMessageId?.(context) ??
      createMessageId('ticket-message', context.nextMessageNumber)
    );
  }

  function getLiveChatId(input: StartSupportLiveChatInput): string {
    const context: InMemorySupportLiveChatIdContext = {
      input,
      liveChats: liveChats.map(cloneLiveChat),
      nextLiveChatNumber,
    };

    return (
      options.createLiveChatId?.(context) ??
      `chat-${nextLiveChatNumber.toString().padStart(4, '0')}`
    );
  }

  function getLiveChatMessageId(
    context: InMemorySupportLiveChatMessageIdContext
  ): string {
    return (
      options.createLiveChatMessageId?.(context) ??
      createMessageId('live-chat-message', context.nextMessageNumber)
    );
  }

  function matchesConfiguredIdentity(
    candidate: SupportUserIdentity,
    customer: SupportUserIdentity
  ): boolean {
    return (
      options.matchCustomer?.(candidate, customer) ??
      matchesIdentity(candidate, customer)
    );
  }

  function getLiveChatQueueContext(
    input: StartSupportLiveChatInput
  ): InMemorySupportLiveChatQueueContext {
    return {
      input,
      liveChats: liveChats.map(cloneLiveChat),
      queuedLiveChatCount: liveChats.filter(session => {
        return session.status === 'queued';
      }).length,
    };
  }

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

  function getLiveChatIndex(sessionId: string): number {
    const normalizedSessionId = sessionId.trim();
    return liveChats.findIndex(session => session.id === normalizedSessionId);
  }

  function getRequiredLiveChat(sessionId: string): SupportLiveChatSession {
    const liveChatIndex = getLiveChatIndex(sessionId);
    const session = liveChatIndex >= 0 ? liveChats[liveChatIndex] : undefined;

    if (!session) {
      throw new Error(`Live chat ${sessionId.trim()} not found`);
    }

    return session;
  }

  function saveLiveChat(
    nextSession: SupportLiveChatSession
  ): SupportLiveChatSession {
    const liveChatIndex = getLiveChatIndex(nextSession.id);

    if (liveChatIndex >= 0) {
      liveChats = liveChats.map((session, index) => {
        return index === liveChatIndex ? nextSession : session;
      });
    } else {
      liveChats = [nextSession, ...liveChats];
    }

    return cloneLiveChat(nextSession);
  }

  return {
    createTicket(input: CreateSupportTicketInput): SupportTicket {
      const now = getNow();
      const reference = getTicketReference(input);
      nextTicketNumber += 1;
      const initialMessage: SupportTicketMessage = {
        id: getTicketMessageId({
          ticketReference: reference,
          input,
          nextMessageNumber,
        }),
        author: 'customer',
        authorLabel: input.customer.name ?? input.customer.email,
        body: input.summary.trim(),
        createdAt: now,
      };
      nextMessageNumber += 1;
      const nextTicket: SupportTicket = {
        reference,
        subject: getTicketSubject(input),
        summary: input.summary.trim(),
        customer: {
          ...input.customer,
        },
        status: options.defaultTicketStatus ?? 'new',
        priority: input.priority ?? options.defaultTicketPriority ?? 'normal',
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
        .filter(ticket => {
          return matchesConfiguredIdentity(ticket.customer, customer);
        })
        .sort(options.sortTickets ?? sortByUpdatedAtDesc)
        .map(cloneTicket);
    },

    listQueue(filter?: SupportQueueFilter): readonly SupportTicket[] {
      const allowedStatuses =
        filter?.statuses ??
        options.defaultQueueStatuses ??
        DEFAULT_OPEN_TICKET_STATUSES;

      return tickets
        .filter(ticket => allowedStatuses.includes(ticket.status))
        .filter(ticket => {
          if (!filter?.assignedTo) {
            return true;
          }

          return ticket.assignedTo === filter.assignedTo;
        })
        .sort(options.sortTickets ?? sortQueueTickets)
        .map(cloneTicket);
    },

    listLiveChatQueue(
      filter?: SupportLiveChatQueueFilter
    ): readonly SupportLiveChatSession[] {
      const allowedStatuses =
        filter?.statuses ??
        options.defaultLiveChatQueueStatuses ??
        DEFAULT_OPEN_LIVE_CHAT_STATUSES;

      return liveChats
        .filter(session => allowedStatuses.includes(session.status))
        .filter(session => {
          if (!filter?.requestedBy) {
            return true;
          }

          return session.requestedBy === filter.requestedBy;
        })
        .sort(options.sortLiveChats ?? sortLiveChatsByQueuePosition)
        .map(cloneLiveChat);
    },

    getLiveChatById(sessionId: string): SupportLiveChatSession | null {
      const liveChatIndex = getLiveChatIndex(sessionId);
      const session = liveChatIndex >= 0 ? liveChats[liveChatIndex] : undefined;
      return session ? cloneLiveChat(session) : null;
    },

    listCustomerLiveChats(
      customer: SupportUserIdentity
    ): readonly SupportLiveChatSession[] {
      return liveChats
        .filter(session => {
          if (!session.customer) {
            return false;
          }

          return matchesConfiguredIdentity(session.customer, customer);
        })
        .sort(options.sortLiveChats ?? sortLiveChatsByRecentActivity)
        .map(cloneLiveChat);
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
        updatedAt: getNow(),
      };

      return saveTicket(nextTicket);
    },

    appendTicketMessage(input: AppendSupportTicketMessageInput): SupportTicket {
      const currentTicket = getRequiredTicket(input.reference);
      const message: SupportTicketMessage = {
        id: getTicketMessageId({
          ticketReference: currentTicket.reference,
          input,
          nextMessageNumber,
        }),
        author: input.author,
        body: input.body.trim(),
        createdAt: getNow(),
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

    startLiveChat(input: StartSupportLiveChatInput): SupportLiveChatSession {
      const liveChatCustomer = input.customer;
      const existingOpenSession = liveChatCustomer
        ? liveChats.find(session => {
            return (
              (session.status === 'queued' || session.status === 'active') &&
              session.customer &&
              matchesConfiguredIdentity(session.customer, liveChatCustomer)
            );
          })
        : undefined;

      if (existingOpenSession) {
        return cloneLiveChat(existingOpenSession);
      }

      const now = getNow();
      const ticketReference = input.ticketReference
        ? normalizeReference(input.ticketReference)
        : undefined;
      const queueContext = getLiveChatQueueContext(input);
      const queuePosition =
        options.getLiveChatQueuePosition?.(queueContext) ??
        queueContext.queuedLiveChatCount + 1;
      const sessionId = getLiveChatId(input);
      const initialMessage: SupportLiveChatMessage = {
        id: getLiveChatMessageId({
          sessionId,
          input,
          nextMessageNumber: nextLiveChatMessageNumber,
        }),
        author: input.requestedBy,
        authorLabel:
          input.requestedBy === 'customer'
            ? (input.customer?.name ?? input.customer?.email)
            : (input.agent?.name ?? input.agent?.email),
        body: input.summary.trim(),
        createdAt: now,
      };
      nextLiveChatMessageNumber += 1;
      const customer = cloneIdentity(input.customer);
      const session: SupportLiveChatSession = {
        id: sessionId,
        summary: input.summary.trim(),
        requestedBy: input.requestedBy,
        queuePosition,
        estimatedWaitMinutes:
          options.getEstimatedWaitMinutes?.({
            ...queueContext,
            queuePosition,
          }) ?? 2 + queueContext.queuedLiveChatCount * 3,
        status: 'queued',
        createdAt: now,
        updatedAt: now,
        ...(ticketReference ? { ticketReference } : {}),
        ...(customer ? { customer } : {}),
        ...(input.agent ? { agent: { ...input.agent } } : {}),
        messages: [initialMessage],
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

    updateLiveChat(input: UpdateSupportLiveChatInput): SupportLiveChatSession {
      const currentSession = getRequiredLiveChat(input.sessionId);
      const status = input.status ?? currentSession.status;
      const nextSession: SupportLiveChatSession = {
        ...currentSession,
        status,
        queuePosition:
          input.queuePosition ??
          (status === 'queued' ? currentSession.queuePosition : 0),
        estimatedWaitMinutes:
          input.estimatedWaitMinutes ??
          (status === 'queued' ? currentSession.estimatedWaitMinutes : 0),
        ...(input.agent !== undefined
          ? input.agent === null
            ? { agent: undefined }
            : { agent: { ...input.agent } }
          : {}),
        updatedAt: getNow(),
      };

      return saveLiveChat(nextSession);
    },

    appendLiveChatMessage(
      input: AppendSupportLiveChatMessageInput
    ): SupportLiveChatSession {
      const currentSession = getRequiredLiveChat(input.sessionId);

      if (currentSession.status === 'ended') {
        throw new Error(`Live chat ${input.sessionId.trim()} has ended`);
      }

      const message: SupportLiveChatMessage = {
        id: getLiveChatMessageId({
          sessionId: currentSession.id,
          input,
          nextMessageNumber: nextLiveChatMessageNumber,
        }),
        author: input.author,
        body: input.body.trim(),
        createdAt: getNow(),
        ...(input.authorLabel ? { authorLabel: input.authorLabel } : {}),
      };
      nextLiveChatMessageNumber += 1;

      const nextSession: SupportLiveChatSession = {
        ...currentSession,
        status:
          input.author === 'agent' && currentSession.status === 'queued'
            ? 'active'
            : currentSession.status,
        queuePosition:
          input.author === 'agent' && currentSession.status === 'queued'
            ? 0
            : currentSession.queuePosition,
        estimatedWaitMinutes:
          input.author === 'agent' && currentSession.status === 'queued'
            ? 0
            : currentSession.estimatedWaitMinutes,
        updatedAt: message.createdAt,
        messages: [...(currentSession.messages ?? []), message],
      };

      return saveLiveChat(nextSession);
    },
  };
}
