import type {
  SupportLiveChatSession,
  SupportTicket,
} from '../supportFlowTypes';
import type { SupportPaginationPage } from '../supportFlowUtils';
import { formatAdminOpeningMessage } from './formatters';
import { createAdminLiveChatFormatters } from './live-chat/formatterResolvers';
import { createAdminTicketFormatters } from './tickets/formatterResolvers';
import type { SupportAdminTicketPage } from './tickets/queue';
import type {
  SupportAdminLiveChatQueueFilterOption,
  SupportAdminFlowConfig,
  SupportAdminFormatterContext,
  SupportAdminTicketQueueFilterOption,
} from './types';

/**
 * Options used to create admin flow formatters.
 */
interface CreateAdminFlowFormattersOptions {
  /**
   * Flow or component configuration for this contract.
   */
  readonly config: SupportAdminFlowConfig;
  /**
   * Shared context passed to formatter functions.
   */
  readonly formatterContext: SupportAdminFormatterContext;
  /**
   * Maximum number of recent activity entries included in formatted output.
   */
  readonly recentActivityLimit?: number | undefined;
  /**
   * Maximum number of transcript messages included in formatted output.
   */
  readonly transcriptLimit?: number | undefined;
}

/**
 * Formatter overrides for messages produced by the admin flow.
 */
interface AdminFlowFormatters {
  /**
   * Opening message formatter or content used by the flow.
   */
  readonly openingMessage: string;
  /**
   * Formats admin ticket details.
   *
   * @param ticket - Support ticket to inspect or render.
   */
  readonly formatAdminTicketDetails: (ticket: SupportTicket) => string;
  /**
   * Formats admin ticket full activity.
   *
   * @param ticket - Support ticket to inspect or render.
   */
  readonly formatAdminTicketFullActivity: (ticket: SupportTicket) => string;
  /**
   * Formats admin ticket queue.
   *
   * @param tickets - Support tickets to process.
   * @param page - Pagination state for the current list.
   * @param filterOptions - Available filter options for the list.
   */
  readonly formatAdminTicketQueue: (
    tickets: readonly SupportTicket[],
    page: SupportAdminTicketPage,
    filterOptions?: {
      /**
       * Currently selected filter state for the list.
       */
      readonly activeFilter?: SupportAdminTicketQueueFilterOption | undefined;
      /**
       * Filter options available for the current list.
       */
      readonly filterOptions:
        | readonly SupportAdminTicketQueueFilterOption[]
        | undefined;
    }
  ) => string;
  /**
   * Formats admin live chat queue.
   *
   * @param sessions - Live-chat sessions available to the formatter.
   * @param page - Pagination state for the current list.
   * @param filterOptions - Available filter options for the list.
   */
  readonly formatAdminLiveChatQueue: (
    sessions: readonly SupportLiveChatSession[],
    page: SupportPaginationPage<SupportLiveChatSession>,
    filterOptions?: {
      /**
       * Currently selected filter state for the list.
       */
      readonly activeFilter?: SupportAdminLiveChatQueueFilterOption | undefined;
      /**
       * Filter options available for the current list.
       */
      readonly filterOptions:
        | readonly SupportAdminLiveChatQueueFilterOption[]
        | undefined;
    }
  ) => string;
  /**
   * Formats admin live chat details.
   *
   * @param session - Live chat session to inspect or render.
   */
  readonly formatAdminLiveChatDetails: (
    session: SupportLiveChatSession
  ) => string;
}

/**
 * Formatter overrides for messages produced by the admin flow.
 *
 * @param options - Options for creating the admin flow formatters.
 */
export function createAdminFlowFormatters({
  config,
  formatterContext,
  recentActivityLimit,
  transcriptLimit,
}: CreateAdminFlowFormattersOptions): AdminFlowFormatters {
  const defaultOpeningMessage = formatAdminOpeningMessage(formatterContext);
  const openingMessage =
    config.initialMessage ??
    config.formatters?.openingMessage?.(formatterContext) ??
    defaultOpeningMessage;
  const ticketFormatters = createAdminTicketFormatters({
    config,
    formatterContext,
    recentActivityLimit,
  });
  const liveChatFormatters = createAdminLiveChatFormatters({
    config,
    formatterContext,
    transcriptLimit,
  });

  return {
    openingMessage,
    ...ticketFormatters,
    ...liveChatFormatters,
  };
}
