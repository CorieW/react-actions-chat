import type {
  AppendSupportLiveChatMessageInput,
  AppendSupportTicketMessageInput,
  SupportAdminFlowCallbacks,
  SupportFlowAdapter,
  SupportLiveChatQueueFilter,
  SupportLiveChatSession,
  SupportQueueFilter,
  SupportTicket,
  SupportTicketListRequest,
  SupportTicketListResponse,
  UpdateSupportLiveChatInput,
  UpdateSupportTicketInput,
} from '../supportFlowTypes';
import { isSupportTicketListResult } from '../supportFlowUtils';
import { sortTicketsByAssignment } from './tickets/queue';
import type { SupportAdminFlowCapabilities } from './types';

/**
 * Options used to create support admin flow services.
 */
interface CreateSupportAdminFlowServicesOptions {
  /**
   * Support adapter used to fetch and persist support state.
   */
  readonly adapter: SupportFlowAdapter | undefined;
  /**
   * Callback-backed service implementations provided by the consumer.
   */
  readonly callbacks: SupportAdminFlowCallbacks;
  /**
   * Runs async support operations with delayed loading indicator handling.
   *
   * @param operation - Async operation to run.
   */
  readonly runWithLoading: <TResult>(
    operation: () => Promise<TResult>
  ) => Promise<TResult>;
}

/**
 * Resolved service methods and capability flags for the support admin flow.
 */
export interface SupportAdminFlowServices {
  /**
   * Resolved backend capabilities available to the flow.
   */
  readonly capabilities: SupportAdminFlowCapabilities;
  /**
   * Lists tickets for an admin queue.
   *
   * @param filter - Filter to apply to the list.
   */
  readonly listTicketQueue: (
    filter?: SupportQueueFilter,
    request?: SupportTicketListRequest
  ) => Promise<SupportTicketListResponse>;
  /**
   * Lists live chat sessions for an admin queue.
   *
   * @param filter - Filter to apply to the list.
   */
  readonly listLiveChatQueue: (
    filter?: SupportLiveChatQueueFilter
  ) => Promise<readonly SupportLiveChatSession[]>;
  /**
   * Returns a support ticket by reference.
   *
   * @param reference - Ticket reference to look up.
   */
  readonly getTicket: (reference: string) => Promise<SupportTicket | null>;
  /**
   * Updates a support ticket.
   *
   * @param input - Input payload for the operation.
   */
  readonly updateTicket: (
    input: UpdateSupportTicketInput
  ) => Promise<SupportTicket>;
  /**
   * Appends a message to a support ticket.
   *
   * @param input - Input payload for the operation.
   */
  readonly appendTicketMessage: (
    input: AppendSupportTicketMessageInput
  ) => Promise<SupportTicket>;
  /**
   * Returns a live chat session by ID.
   *
   * @param sessionId - Live chat session ID to look up.
   */
  readonly getLiveChat: (
    sessionId: string
  ) => Promise<SupportLiveChatSession | null>;
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
}

/**
 * Resolved service methods and capability flags for the create support admin flow.
 *
 * @param options - Options for creating the support admin flow services.
 */
export function createSupportAdminFlowServices({
  adapter,
  callbacks,
  runWithLoading,
}: CreateSupportAdminFlowServicesOptions): SupportAdminFlowServices {
  const canListTicketQueue = Boolean(
    callbacks.listTicketQueue ?? adapter?.listQueue
  );
  const canListLiveChatQueue = Boolean(
    callbacks.listLiveChatQueue ?? adapter?.listLiveChatQueue
  );
  const canGetTicket = Boolean(
    callbacks.getTicket ?? adapter?.getTicketByReference
  );
  const canUpdateTicket = Boolean(
    callbacks.updateTicket ?? adapter?.updateTicket
  );
  const canAppendTicketMessage = Boolean(
    callbacks.appendTicketMessage ?? adapter?.appendTicketMessage
  );
  const canGetLiveChat = Boolean(
    callbacks.getLiveChat ?? adapter?.getLiveChatById
  );
  const canUpdateLiveChat = Boolean(
    callbacks.updateLiveChat ?? adapter?.updateLiveChat
  );
  const canAppendLiveChatMessage = Boolean(
    callbacks.appendLiveChatMessage ?? adapter?.appendLiveChatMessage
  );
  const canOpenLiveChatQueue = canListLiveChatQueue && canGetLiveChat;
  const capabilities: SupportAdminFlowCapabilities = {
    canListTicketQueue,
    canListLiveChatQueue,
    canGetTicket,
    canUpdateTicket,
    canAppendTicketMessage,
    canGetLiveChat,
    canUpdateLiveChat,
    canAppendLiveChatMessage,
    canOpenLiveChatQueue,
  };

  const sortCompleteTicketListResponse = (
    response: SupportTicketListResponse,
    request: SupportTicketListRequest | undefined
  ): SupportTicketListResponse => {
    if (!isSupportTicketListResult(response)) {
      return sortTicketsByAssignment(response);
    }

    const isPagedResponse =
      request?.limit !== undefined ||
      request?.pageSize !== undefined ||
      (request?.offset ?? 0) > 0 ||
      response.hasMore === true ||
      (response.totalTickets !== undefined &&
        response.tickets.length < response.totalTickets) ||
      (response.hasMore === undefined && response.nextOffset !== undefined);

    if (isPagedResponse) {
      return response;
    }

    return {
      ...response,
      tickets: sortTicketsByAssignment(response.tickets),
    };
  };

  const listTicketQueue = async (
    filter?: SupportQueueFilter,
    request?: SupportTicketListRequest
  ): Promise<SupportTicketListResponse> => {
    return runWithLoading(async () => {
      if (callbacks.listTicketQueue) {
        return sortCompleteTicketListResponse(
          await callbacks.listTicketQueue(filter, request),
          request
        );
      }

      if (adapter?.listQueue) {
        return sortCompleteTicketListResponse(
          await adapter.listQueue(filter, request),
          request
        );
      }

      return [];
    });
  };

  const listLiveChatQueue = async (
    filter?: SupportLiveChatQueueFilter
  ): Promise<readonly SupportLiveChatSession[]> => {
    return runWithLoading(async () => {
      if (callbacks.listLiveChatQueue) {
        return callbacks.listLiveChatQueue(filter);
      }

      if (adapter?.listLiveChatQueue) {
        return adapter.listLiveChatQueue(filter);
      }

      return [];
    });
  };

  const getTicket = async (
    reference: string
  ): Promise<SupportTicket | null> => {
    return runWithLoading(async () => {
      if (callbacks.getTicket) {
        return callbacks.getTicket(reference);
      }

      if (adapter?.getTicketByReference) {
        return adapter.getTicketByReference(reference);
      }

      return null;
    });
  };

  const updateTicket = async (
    input: UpdateSupportTicketInput
  ): Promise<SupportTicket> => {
    return runWithLoading(async () => {
      if (callbacks.updateTicket) {
        return callbacks.updateTicket(input);
      }

      if (adapter?.updateTicket) {
        return adapter.updateTicket(input);
      }

      throw new Error('No support ticket update callback was provided.');
    });
  };

  const appendTicketMessage = async (
    input: AppendSupportTicketMessageInput
  ): Promise<SupportTicket> => {
    return runWithLoading(async () => {
      if (callbacks.appendTicketMessage) {
        return callbacks.appendTicketMessage(input);
      }

      if (adapter?.appendTicketMessage) {
        return adapter.appendTicketMessage(input);
      }

      throw new Error('No support ticket message callback was provided.');
    });
  };

  const getLiveChat = async (
    sessionId: string
  ): Promise<SupportLiveChatSession | null> => {
    return runWithLoading(async () => {
      if (callbacks.getLiveChat) {
        return callbacks.getLiveChat(sessionId);
      }

      if (adapter?.getLiveChatById) {
        return adapter.getLiveChatById(sessionId);
      }

      return null;
    });
  };

  const updateLiveChat = async (
    input: UpdateSupportLiveChatInput
  ): Promise<SupportLiveChatSession> => {
    return runWithLoading(async () => {
      if (callbacks.updateLiveChat) {
        return callbacks.updateLiveChat(input);
      }

      if (adapter?.updateLiveChat) {
        return adapter.updateLiveChat(input);
      }

      throw new Error('No live chat update callback was provided.');
    });
  };

  const appendLiveChatMessage = async (
    input: AppendSupportLiveChatMessageInput
  ): Promise<SupportLiveChatSession> => {
    return runWithLoading(async () => {
      if (callbacks.appendLiveChatMessage) {
        return callbacks.appendLiveChatMessage(input);
      }

      if (adapter?.appendLiveChatMessage) {
        return adapter.appendLiveChatMessage(input);
      }

      throw new Error('No live chat message callback was provided.');
    });
  };

  return {
    capabilities,
    listTicketQueue,
    listLiveChatQueue,
    getTicket,
    updateTicket,
    appendTicketMessage,
    getLiveChat,
    updateLiveChat,
    appendLiveChatMessage,
  };
}
