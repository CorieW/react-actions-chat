import type { SupportTicket } from '../../supportFlowTypes';
import { formatTicketFullActivity } from '../../supportFlowUtils';
import type {
  SupportAdminFlowConfig,
  SupportAdminFormatterContext,
  SupportAdminTicketQueueFilterOption,
  SupportAdminTicketFormatterContext,
} from '../types';
import { formatQueueSummary, formatTicketDetails } from './formatters';
import type { SupportAdminTicketPage } from './queue';

/**
 * Options used to create admin ticket formatters.
 */
interface CreateAdminTicketFormattersOptions {
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
}

/**
 * Formatter overrides for messages produced by the admin ticket.
 */
interface AdminTicketFormatters {
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
}

/**
 * Formatter overrides for messages produced by the admin ticket flow.
 *
 * @param options - Options for creating the admin ticket formatters.
 */
export function createAdminTicketFormatters({
  config,
  formatterContext,
  recentActivityLimit,
}: CreateAdminTicketFormattersOptions): AdminTicketFormatters {
  const formatAdminTicketDetails = (ticket: SupportTicket): string => {
    const context: SupportAdminTicketFormatterContext = {
      ...formatterContext,
      ticket,
    };

    return (
      config.formatters?.ticketDetails?.(context) ??
      formatTicketDetails(ticket, recentActivityLimit)
    );
  };

  const formatAdminTicketFullActivity = (ticket: SupportTicket): string => {
    const context: SupportAdminTicketFormatterContext = {
      ...formatterContext,
      ticket,
    };

    return (
      config.formatters?.ticketFullActivity?.(context) ??
      formatTicketFullActivity(ticket)
    );
  };

  const formatAdminTicketQueue = (
    tickets: readonly SupportTicket[],
    page: SupportAdminTicketPage,
    filterState?: {
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
  ): string => {
    return (
      config.formatters?.ticketQueue?.({
        ...formatterContext,
        tickets,
        visibleTickets: page.visibleTickets,
        currentPage: page.currentPage,
        pageCount: page.pageCount,
        pageSize: page.pageSize,
        totalTickets: page.totalTickets,
        activeFilterId: filterState?.activeFilter?.id,
        activeFilterLabel: filterState?.activeFilter?.label,
        filterOptions: filterState?.filterOptions,
      }) ?? formatQueueSummary(page.visibleTickets, page)
    );
  };

  return {
    formatAdminTicketDetails,
    formatAdminTicketFullActivity,
    formatAdminTicketQueue,
  };
}
