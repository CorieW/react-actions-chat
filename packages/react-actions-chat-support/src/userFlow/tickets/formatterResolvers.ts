import type { SupportTicket } from '../../supportFlowTypes';
import {
  formatTicketFullActivity,
  type SupportPaginationPage,
} from '../../supportFlowUtils';
import type {
  SupportUserFlowConfig,
  SupportUserFormatterContext,
  SupportUserTicketFilterOption,
  SupportUserTicketFormatterContext,
} from '../types';
import { formatTicketList, formatTicketSummary } from './formatters';

/**
 * Options used to create customer ticket formatters.
 */
interface CreateUserTicketFormattersOptions {
  /**
   * Flow or component configuration for this contract.
   */
  readonly config: SupportUserFlowConfig;
  /**
   * Shared context passed to formatter functions.
   */
  readonly formatterContext: SupportUserFormatterContext;
  /**
   * Maximum number of recent activity entries included in formatted output.
   */
  readonly recentActivityLimit?: number | undefined;
}

/**
 * Formatter overrides for messages produced by the customer ticket.
 */
interface UserTicketFormatters {
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
}

/**
 * Formatter overrides for messages produced by the customer ticket flow.
 *
 * @param options - Options for creating the customer ticket formatters.
 */
export function createUserTicketFormatters({
  config,
  formatterContext,
  recentActivityLimit,
}: CreateUserTicketFormattersOptions): UserTicketFormatters {
  const formatUserTicketSummary = (ticket: SupportTicket): string => {
    const context: SupportUserTicketFormatterContext = {
      ...formatterContext,
      ticket,
    };

    return (
      config.formatters?.ticketSummary?.(context) ??
      formatTicketSummary(ticket, recentActivityLimit)
    );
  };

  const formatUserTicketFullActivity = (ticket: SupportTicket): string => {
    const context: SupportUserTicketFormatterContext = {
      ...formatterContext,
      ticket,
    };

    return (
      config.formatters?.ticketFullActivity?.(context) ??
      formatTicketFullActivity(ticket)
    );
  };

  const formatUserTicketList = (
    tickets: readonly SupportTicket[],
    page: SupportPaginationPage<SupportTicket>,
    filterState?: {
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
  ): string => {
    return (
      config.formatters?.ticketList?.({
        ...formatterContext,
        tickets,
        visibleTickets: page.visibleItems,
        currentPage: page.currentPage,
        pageCount: page.pageCount,
        pageSize: page.pageSize,
        totalTickets: page.totalItems,
        activeFilterId: filterState?.activeFilter?.id,
        activeFilterLabel: filterState?.activeFilter?.label,
        filterOptions: filterState?.filterOptions,
      }) ?? formatTicketList(page)
    );
  };

  return {
    formatUserTicketSummary,
    formatUserTicketFullActivity,
    formatUserTicketList,
  };
}
