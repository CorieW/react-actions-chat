import type { MessageButton } from 'react-actions-chat';
import type { SupportTicket } from '../../supportFlowTypes';
import type { SupportUserFlowButtonContext } from '../types';

/**
 * Button customization hook scoped to customer flow internals.
 *
 * @param context - Context object available to this resolver.
 */
type CustomizeUserButtons = (
  context: Omit<SupportUserFlowButtonContext, 'customer'>
) => readonly MessageButton[];

/**
 * Options used to create customer primary buttons.
 */
interface CreateUserPrimaryButtonsOptions {
  /**
   * Support tickets in the current list or queue.
   */
  readonly tickets: readonly SupportTicket[];
  /**
   * Whether ticket list pending is true.
   */
  readonly isTicketListPending: boolean;
  /**
   * Whether ticket creation is available.
   */
  readonly canCreateTicket: boolean;
  /**
   * Whether the current customer can use live chat.
   */
  readonly canUseLiveChat: boolean;
  /**
   * Whether ticket listing is available.
   */
  readonly canListTickets: boolean;
  /**
   * Factory used to create the open-ticket action button.
   */
  readonly createOpenTicketButton: () => MessageButton;
  /**
   * Factory used to create the live-chat action button.
   */
  readonly createLiveChatButton: () => MessageButton;
  /**
   * Creates the view tickets button.
   */
  readonly createViewTicketsButton: () => MessageButton;
  /**
   * Hook used to customize customer primary buttons before rendering.
   */
  readonly customizeButtons: CustomizeUserButtons;
}

/**
 * Creates customer primary buttons.
 *
 * @param options - Options for creating the customer primary buttons.
 */
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
