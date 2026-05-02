import type {
  AppendSupportLiveChatMessageInput,
  AppendSupportTicketMessageInput,
  SupportAdminFlowCallbacks,
  SupportFlowAdapter,
  SupportLiveChatQueueFilter,
  SupportLiveChatSession,
  SupportQueueFilter,
  SupportTicket,
  UpdateSupportLiveChatInput,
  UpdateSupportTicketInput,
} from '../supportFlowTypes';
import { sortTicketsByAssignment } from './tickets/queue';
import type { SupportAdminFlowCapabilities } from './types';

interface CreateSupportAdminFlowServicesOptions {
  readonly adapter: SupportFlowAdapter | undefined;
  readonly callbacks: SupportAdminFlowCallbacks;
}

export interface SupportAdminFlowServices {
  readonly capabilities: SupportAdminFlowCapabilities;
  readonly listTicketQueue: (
    filter?: SupportQueueFilter
  ) => Promise<readonly SupportTicket[]>;
  readonly listLiveChatQueue: (
    filter?: SupportLiveChatQueueFilter
  ) => Promise<readonly SupportLiveChatSession[]>;
  readonly getTicket: (reference: string) => Promise<SupportTicket | null>;
  readonly updateTicket: (
    input: UpdateSupportTicketInput
  ) => Promise<SupportTicket>;
  readonly appendTicketMessage: (
    input: AppendSupportTicketMessageInput
  ) => Promise<SupportTicket>;
  readonly getLiveChat: (
    sessionId: string
  ) => Promise<SupportLiveChatSession | null>;
  readonly updateLiveChat: (
    input: UpdateSupportLiveChatInput
  ) => Promise<SupportLiveChatSession>;
  readonly appendLiveChatMessage: (
    input: AppendSupportLiveChatMessageInput
  ) => Promise<SupportLiveChatSession>;
}

export function createSupportAdminFlowServices({
  adapter,
  callbacks,
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

  const listTicketQueue = async (
    filter?: SupportQueueFilter
  ): Promise<readonly SupportTicket[]> => {
    if (callbacks.listTicketQueue) {
      return sortTicketsByAssignment(await callbacks.listTicketQueue(filter));
    }

    if (adapter?.listQueue) {
      return sortTicketsByAssignment(await adapter.listQueue(filter));
    }

    return [];
  };

  const listLiveChatQueue = async (
    filter?: SupportLiveChatQueueFilter
  ): Promise<readonly SupportLiveChatSession[]> => {
    if (callbacks.listLiveChatQueue) {
      return callbacks.listLiveChatQueue(filter);
    }

    if (adapter?.listLiveChatQueue) {
      return adapter.listLiveChatQueue(filter);
    }

    return [];
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

  const updateTicket = async (
    input: UpdateSupportTicketInput
  ): Promise<SupportTicket> => {
    if (callbacks.updateTicket) {
      return callbacks.updateTicket(input);
    }

    if (adapter?.updateTicket) {
      return adapter.updateTicket(input);
    }

    throw new Error('No support ticket update callback was provided.');
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
