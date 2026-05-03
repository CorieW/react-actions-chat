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
  SupportTicketListRequest,
  SupportTicketListResult,
  SupportTicketMessage,
  SupportUserIdentity,
  UpdateSupportLiveChatInput,
  UpdateSupportTicketInput,
} from './supportFlowTypes';
import {
  cloneIdentity,
  cloneLiveChat,
  cloneTicket,
  createMessageId,
  DEFAULT_OPEN_LIVE_CHAT_STATUSES,
  DEFAULT_OPEN_TICKET_STATUSES,
  deriveSubject,
  inferNextTicketNumber,
  matchesIdentity,
  normalizeReference,
  sortByUpdatedAtDesc,
  sortLiveChatsByQueuePosition,
  sortLiveChatsByRecentActivity,
  sortQueueTickets,
} from './memorySupportFlowAdapter/index';

/**
 * Creates a segmented ticket-list result from matching in-memory tickets.
 *
 * @param tickets - Matching tickets available in the adapter state.
 * @param request - Optional segmented-list request from a support flow.
 */
function createTicketListResult(
  tickets: readonly SupportTicket[],
  request?: SupportTicketListRequest
): SupportTicketListResult {
  const offset = Math.max(0, Math.floor(request?.offset ?? 0));
  const requestedLimit = request?.limit ?? request?.pageSize ?? tickets.length;
  const limit = tickets.length
    ? Math.max(
        1,
        Number.isFinite(requestedLimit)
          ? Math.floor(requestedLimit)
          : tickets.length
      )
    : 0;
  const nextOffset = offset + limit;

  return {
    tickets: tickets.slice(offset, nextOffset).map(cloneTicket),
    totalTickets: tickets.length,
    hasMore: nextOffset < tickets.length,
    nextOffset,
  };
}

/**
 * Creates an in memory support flow adapter.
 *
 * @param options - In-memory adapter seed data, defaults, and factory overrides.
 */
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
      customer: SupportUserIdentity,
      request?: SupportTicketListRequest
    ): SupportTicketListResult {
      return createTicketListResult(
        tickets
          .filter(ticket => {
            return matchesConfiguredIdentity(ticket.customer, customer);
          })
          .sort(options.sortTickets ?? sortByUpdatedAtDesc),
        request
      );
    },

    listQueue(
      filter?: SupportQueueFilter,
      request?: SupportTicketListRequest
    ): SupportTicketListResult {
      const allowedStatuses =
        filter?.statuses ??
        options.defaultQueueStatuses ??
        DEFAULT_OPEN_TICKET_STATUSES;

      return createTicketListResult(
        tickets
          .filter(ticket => allowedStatuses.includes(ticket.status))
          .filter(ticket => {
            if (!filter?.assignedTo) {
              return true;
            }

            return ticket.assignedTo === filter.assignedTo;
          })
          .sort(options.sortTickets ?? sortQueueTickets),
        request
      );
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
