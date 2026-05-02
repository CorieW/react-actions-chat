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

interface CreateAdminTicketFormattersOptions {
  readonly config: SupportAdminFlowConfig;
  readonly formatterContext: SupportAdminFormatterContext;
  readonly recentActivityLimit: number;
}

interface AdminTicketFormatters {
  readonly formatAdminTicketDetails: (ticket: SupportTicket) => string;
  readonly formatAdminTicketFullActivity: (ticket: SupportTicket) => string;
  readonly formatAdminTicketQueue: (
    tickets: readonly SupportTicket[],
    page: SupportAdminTicketPage,
    filterOptions?: {
      readonly activeFilter?: SupportAdminTicketQueueFilterOption | undefined;
      readonly filterOptions:
        | readonly SupportAdminTicketQueueFilterOption[]
        | undefined;
    }
  ) => string;
}

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
      readonly activeFilter?: SupportAdminTicketQueueFilterOption | undefined;
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
