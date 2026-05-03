import type {
  AppendSupportLiveChatMessageInput,
  AppendSupportTicketMessageInput,
  CreateSupportTicketInput,
  MaybePromise,
  StartSupportLiveChatInput,
  SupportFlowAdapter,
  SupportLiveChatSession,
  SupportTicket,
  SupportUserFlowCallbacks,
  SupportUserIdentity,
  UpdateSupportLiveChatInput,
} from '../supportFlowTypes';
import { isPromiseLike } from '../supportFlowUtils';
import type { InitialTicketListState } from './types';

/**
 * Options used to create support customer flow services.
 */
interface CreateSupportUserFlowServicesOptions {
  /**
   * Support adapter used to fetch and persist support state.
   */
  readonly adapter: SupportFlowAdapter | undefined;
  /**
   * Callback-backed service implementations provided by the consumer.
   */
  readonly callbacks: SupportUserFlowCallbacks;
  /**
   * Customer identity associated with the flow or record.
   */
  readonly customer: SupportUserIdentity;
  /**
   * Returns whether a live chat is still open.
   *
   * @param session - Live chat session to inspect or render.
   */
  readonly isOpenLiveChat: (session: SupportLiveChatSession) => boolean;
}

/**
 * Resolved service methods and capability flags for the support customer flow.
 */
export interface SupportUserFlowServices {
  /**
   * Whether ticket creation is available.
   */
  readonly canCreateTicket: boolean;
  /**
   * Whether ticket listing is available.
   */
  readonly canListTickets: boolean;
  /**
   * Whether ticket message append actions are available.
   */
  readonly canAppendTicketMessage: boolean;
  /**
   * Whether the current customer can use live chat.
   */
  readonly canUseLiveChat: boolean;
  /**
   * Whether individual live-chat lookup is available.
   */
  readonly canGetLiveChat: boolean;
  /**
   * Creates a support ticket.
   *
   * @param input - Input payload for the operation.
   */
  readonly createTicket: (
    input: CreateSupportTicketInput
  ) => Promise<SupportTicket>;
  /**
   * Returns a support ticket by reference.
   *
   * @param reference - Ticket reference to look up.
   */
  readonly getTicket: (reference: string) => Promise<SupportTicket | null>;
  /**
   * Lists the tickets.
   */
  readonly listTickets: () => Promise<readonly SupportTicket[]>;
  /**
   * Appends a message to a support ticket.
   *
   * @param input - Input payload for the operation.
   */
  readonly appendTicketMessage: (
    input: AppendSupportTicketMessageInput
  ) => Promise<SupportTicket>;
  /**
   * Starts a support live chat.
   *
   * @param input - Input payload for the operation.
   */
  readonly startLiveChat: (
    input: StartSupportLiveChatInput
  ) => Promise<SupportLiveChatSession>;
  /**
   * Updates a live chat session.
   *
   * @param input - Input payload for the operation.
   */
  readonly updateLiveChat: (
    input: UpdateSupportLiveChatInput
  ) => Promise<SupportLiveChatSession>;
  /**
   * Appends a message to a live chat session.
   *
   * @param input - Input payload for the operation.
   */
  readonly appendLiveChatMessage: (
    input: AppendSupportLiveChatMessageInput
  ) => Promise<SupportLiveChatSession>;
  /**
   * Returns a live chat session by ID.
   *
   * @param sessionId - Live chat session ID to look up.
   */
  readonly getLiveChat: (
    sessionId: string
  ) => Promise<SupportLiveChatSession | null>;
  /**
   * Service used to retrieve the customer's open live-chat session.
   */
  readonly getOpenLiveChat: () => Promise<SupportLiveChatSession | null>;
  /**
   * Reads the initial customer tickets for the flow.
   */
  readonly readInitialTickets: () => InitialTicketListState;
}

/**
 * Resolved service methods and capability flags for the create support customer flow.
 *
 * @param options - Options for creating the support customer flow services.
 */
export function createSupportUserFlowServices({
  adapter,
  callbacks,
  customer,
  isOpenLiveChat,
}: CreateSupportUserFlowServicesOptions): SupportUserFlowServices {
  const canCreateTicket = Boolean(
    callbacks.createTicket ?? adapter?.createTicket
  );
  const canListTickets = Boolean(
    callbacks.listTickets ?? adapter?.listCustomerTickets
  );
  const canAppendTicketMessage = Boolean(
    callbacks.appendTicketMessage ?? adapter?.appendTicketMessage
  );
  const canStartLiveChat = Boolean(
    callbacks.startLiveChat ?? adapter?.startLiveChat
  );
  const canUpdateLiveChat = Boolean(
    callbacks.updateLiveChat ?? adapter?.updateLiveChat
  );
  const canAppendLiveChatMessage = Boolean(
    callbacks.appendLiveChatMessage ?? adapter?.appendLiveChatMessage
  );
  const canGetLiveChat = Boolean(
    callbacks.getLiveChat ?? adapter?.getLiveChatById
  );
  const canUseLiveChat =
    canStartLiveChat &&
    canGetLiveChat &&
    canUpdateLiveChat &&
    canAppendLiveChatMessage;

  const createTicket = async (
    input: CreateSupportTicketInput
  ): Promise<SupportTicket> => {
    if (callbacks.createTicket) {
      return callbacks.createTicket(input);
    }

    if (adapter?.createTicket) {
      return adapter.createTicket(input);
    }

    throw new Error('No support ticket creation callback was provided.');
  };

  const getTicket = async (
    reference: string
  ): Promise<SupportTicket | null> => {
    if (callbacks.getTicket) {
      return callbacks.getTicket(reference);
    }

    if (adapter?.getTicketByReference) {
      return adapter.getTicketByReference(reference);
    }

    return null;
  };

  const listTickets = async (): Promise<readonly SupportTicket[]> => {
    if (callbacks.listTickets) {
      return callbacks.listTickets(customer);
    }

    if (adapter?.listCustomerTickets) {
      return adapter.listCustomerTickets(customer);
    }

    return [];
  };

  const appendTicketMessage = async (
    input: AppendSupportTicketMessageInput
  ): Promise<SupportTicket> => {
    if (callbacks.appendTicketMessage) {
      return callbacks.appendTicketMessage(input);
    }

    if (adapter?.appendTicketMessage) {
      return adapter.appendTicketMessage(input);
    }

    throw new Error('No support ticket message callback was provided.');
  };

  const startLiveChat = async (
    input: StartSupportLiveChatInput
  ): Promise<SupportLiveChatSession> => {
    if (callbacks.startLiveChat) {
      return callbacks.startLiveChat(input);
    }

    if (adapter?.startLiveChat) {
      return adapter.startLiveChat(input);
    }

    throw new Error('No live chat start callback was provided.');
  };

  const updateLiveChat = async (
    input: UpdateSupportLiveChatInput
  ): Promise<SupportLiveChatSession> => {
    if (callbacks.updateLiveChat) {
      return callbacks.updateLiveChat(input);
    }

    if (adapter?.updateLiveChat) {
      return adapter.updateLiveChat(input);
    }

    throw new Error('No live chat update callback was provided.');
  };

  const appendLiveChatMessage = async (
    input: AppendSupportLiveChatMessageInput
  ): Promise<SupportLiveChatSession> => {
    if (callbacks.appendLiveChatMessage) {
      return callbacks.appendLiveChatMessage(input);
    }

    if (adapter?.appendLiveChatMessage) {
      return adapter.appendLiveChatMessage(input);
    }

    throw new Error('No live chat message callback was provided.');
  };

  const getLiveChat = async (
    sessionId: string
  ): Promise<SupportLiveChatSession | null> => {
    if (callbacks.getLiveChat) {
      return callbacks.getLiveChat(sessionId);
    }

    if (adapter?.getLiveChatById) {
      return adapter.getLiveChatById(sessionId);
    }

    return null;
  };

  const readInitialTickets = (): InitialTicketListState => {
    if (!canListTickets) {
      return {
        tickets: [],
        isPending: false,
      };
    }

    let tickets: MaybePromise<readonly SupportTicket[]> | undefined;

    try {
      tickets = callbacks.listTickets
        ? callbacks.listTickets(customer)
        : adapter?.listCustomerTickets?.(customer);
    } catch {
      return {
        tickets: [],
        isPending: false,
      };
    }

    if (!tickets || isPromiseLike(tickets)) {
      if (tickets) {
        void tickets.catch(() => undefined);
      }
      return {
        tickets: [],
        isPending: Boolean(tickets),
      };
    }

    return {
      tickets,
      isPending: false,
    };
  };

  const getOpenLiveChat = async (): Promise<SupportLiveChatSession | null> => {
    if (callbacks.getOpenLiveChat) {
      return callbacks.getOpenLiveChat(customer);
    }

    if (!adapter?.listCustomerLiveChats) {
      return null;
    }

    const sessions = await adapter.listCustomerLiveChats(customer);
    return sessions.find(isOpenLiveChat) ?? null;
  };

  return {
    canCreateTicket,
    canListTickets,
    canAppendTicketMessage,
    canUseLiveChat,
    canGetLiveChat,
    createTicket,
    getTicket,
    listTickets,
    appendTicketMessage,
    startLiveChat,
    updateLiveChat,
    appendLiveChatMessage,
    getLiveChat,
    getOpenLiveChat,
    readInitialTickets,
  };
}
