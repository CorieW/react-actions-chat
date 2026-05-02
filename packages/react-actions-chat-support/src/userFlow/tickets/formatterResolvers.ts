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

interface CreateUserTicketFormattersOptions {
  readonly config: SupportUserFlowConfig;
  readonly formatterContext: SupportUserFormatterContext;
  readonly recentActivityLimit: number;
}

interface UserTicketFormatters {
  readonly formatUserTicketSummary: (ticket: SupportTicket) => string;
  readonly formatUserTicketFullActivity: (ticket: SupportTicket) => string;
  readonly formatUserTicketList: (
    tickets: readonly SupportTicket[],
    page: SupportPaginationPage<SupportTicket>,
    filterOptions?: {
      readonly activeFilter?: SupportUserTicketFilterOption | undefined;
      readonly filterOptions:
        | readonly SupportUserTicketFilterOption[]
        | undefined;
    }
  ) => string;
}

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
      readonly activeFilter?: SupportUserTicketFilterOption | undefined;
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
