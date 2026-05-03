import type {
  SupportLiveChatMessage,
  SupportLiveChatSession,
  SupportTicket,
  SupportTicketMessage,
  SupportUserIdentity,
} from '../supportFlowTypes';

/**
 * Creates a defensive clone of identity.
 *
 * @param identity - Customer identity to clone, or undefined when absent.
 */
export function cloneIdentity(
  identity: SupportUserIdentity | undefined
): SupportUserIdentity | undefined {
  if (!identity) {
    return undefined;
  }

  return {
    ...identity,
  };
}

/**
 * Creates a defensive clone of a ticket message.
 *
 * @param message - Message to inspect, format, or clone.
 */
function cloneMessage(message: SupportTicketMessage): SupportTicketMessage {
  return {
    ...message,
    createdAt: new Date(message.createdAt),
  };
}

/**
 * Creates a defensive clone of a live chat message.
 *
 * @param message - Message to inspect, format, or clone.
 */
function cloneLiveChatMessage(
  message: SupportLiveChatMessage
): SupportLiveChatMessage {
  return {
    ...message,
    createdAt: new Date(message.createdAt),
  };
}

/**
 * Creates a defensive clone of ticket.
 *
 * @param ticket - Support ticket to inspect, format, or update.
 */
export function cloneTicket(ticket: SupportTicket): SupportTicket {
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

/**
 * Creates a defensive clone of live chat.
 *
 * @param session - Live chat session to inspect, format, or update.
 */
export function cloneLiveChat(
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
