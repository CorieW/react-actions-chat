import type {
  SupportLiveChatMessage,
  SupportLiveChatSession,
  SupportTicket,
  SupportTicketMessage,
  SupportUserIdentity,
} from '../supportFlowTypes';

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
