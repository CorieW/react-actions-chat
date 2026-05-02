import type { MessageButton } from 'react-actions-chat';
import type { SupportTicket } from '../../supportFlowTypes';
import type { SupportUserFlowButtonContext } from '../types';

type CustomizeUserButtons = (
  context: Omit<SupportUserFlowButtonContext, 'customer'>
) => readonly MessageButton[];

interface CreateUserPrimaryButtonsOptions {
  readonly tickets: readonly SupportTicket[];
  readonly isTicketListPending: boolean;
  readonly canCreateTicket: boolean;
  readonly canUseLiveChat: boolean;
  readonly canListTickets: boolean;
  readonly createOpenTicketButton: () => MessageButton;
  readonly createLiveChatButton: () => MessageButton;
  readonly createViewTicketsButton: () => MessageButton;
  readonly customizeButtons: CustomizeUserButtons;
}

export function createUserPrimaryButtons({
  tickets,
  isTicketListPending,
  canCreateTicket,
  canUseLiveChat,
  canListTickets,
  createOpenTicketButton,
  createLiveChatButton,
  createViewTicketsButton,
  customizeButtons,
}: CreateUserPrimaryButtonsOptions): readonly MessageButton[] {
  const defaultButtons = [
    ...(canCreateTicket ? [createOpenTicketButton()] : []),
    ...(canUseLiveChat ? [createLiveChatButton()] : []),
    ...(canListTickets && (tickets.length > 0 || isTicketListPending)
      ? [createViewTicketsButton()]
      : []),
  ];

  return customizeButtons({
    slot: 'primary',
    defaultButtons,
    tickets,
  });
}
