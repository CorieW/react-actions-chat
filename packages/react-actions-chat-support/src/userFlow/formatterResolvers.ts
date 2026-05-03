import type {
  SupportLiveChatSession,
  SupportTicket,
} from '../supportFlowTypes';
import {
  escapeMarkdown,
  joinMarkdownLines,
  type SupportPaginationPage,
} from '../supportFlowUtils';
import { createUserLiveChatFormatters } from './live-chat/formatterResolvers';
import { createUserTicketFormatters } from './tickets/formatterResolvers';
import type {
  SupportUserFlowConfig,
  SupportUserFormatterContext,
  SupportUserTicketFilterOption,
} from './types';

/**
 * Options used to create customer flow formatters.
 */
interface CreateUserFlowFormattersOptions {
  /**
   * Flow or component configuration for this contract.
   */
  readonly config: SupportUserFlowConfig;
  /**
   * Shared context passed to formatter functions.
   */
  readonly formatterContext: SupportUserFormatterContext;
  /**
   * Brand or workspace name shown in generated flow messages.
   */
  readonly brandName: string;
  /**
   * Maximum number of recent activity entries included in formatted output.
   */
  readonly recentActivityLimit?: number | undefined;
}

/**
 * Formatter overrides for messages produced by the customer flow.
 */
interface UserFlowFormatters {
  /**
   * Opening message formatter or content used by the flow.
   */
  readonly openingMessage: string;
  /**
   * Formats user ticket summary.
   *
   * @param ticket - Support ticket to inspect or render.
   */
  readonly formatUserTicketSummary: (ticket: SupportTicket) => string;
  /**
   * Formats user ticket full activity.
   *
   * @param ticket - Support ticket to inspect or render.
   */
  readonly formatUserTicketFullActivity: (ticket: SupportTicket) => string;
  /**
   * Formats user ticket list.
   *
   * @param tickets - Support tickets to process.
   * @param page - Pagination state for the current list.
   * @param filterOptions - Available filter options for the list.
   */
  readonly formatUserTicketList: (
    tickets: readonly SupportTicket[],
    page: SupportPaginationPage<SupportTicket>,
    filterOptions?: {
      /**
       * Currently selected filter state for the list.
       */
      readonly activeFilter?: SupportUserTicketFilterOption | undefined;
      /**
       * Filter options available for the current list.
       */
      readonly filterOptions:
        | readonly SupportUserTicketFilterOption[]
        | undefined;
    }
  ) => string;
  /**
   * Formats user live chat details.
   *
   * @param session - Live chat session to inspect or render.
   */
  readonly formatUserLiveChatDetails: (
    session: SupportLiveChatSession
  ) => string;
  /**
   * Formats user live chat ended.
   *
   * @param session - Live chat session to inspect or render.
   */
  readonly formatUserLiveChatEnded: (session: SupportLiveChatSession) => string;
}

/**
 * Formatter overrides for messages produced by the customer flow.
 *
 * @param options - Options for creating the customer flow formatters.
 */
export function createUserFlowFormatters({
  config,
  formatterContext,
  brandName,
  recentActivityLimit,
}: CreateUserFlowFormattersOptions): UserFlowFormatters {
  const defaultOpeningMessage = joinMarkdownLines([
    `## ${escapeMarkdown(brandName)} is ready to help`,
    '',
    'Choose a next step:',
  ]);
  const openingMessage =
    config.initialMessage ??
    config.formatters?.openingMessage?.(formatterContext) ??
    defaultOpeningMessage;
  const ticketFormatters = createUserTicketFormatters({
    config,
    formatterContext,
    recentActivityLimit,
  });
  const liveChatFormatters = createUserLiveChatFormatters({
    config,
    formatterContext,
  });

  return {
    openingMessage,
    ...ticketFormatters,
    ...liveChatFormatters,
  };
}
