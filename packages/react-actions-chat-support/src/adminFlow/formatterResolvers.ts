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

interface CreateAdminFlowFormattersOptions {
  readonly config: SupportAdminFlowConfig;
  readonly formatterContext: SupportAdminFormatterContext;
  readonly recentActivityLimit: number;
  readonly transcriptLimit: number;
}

interface AdminFlowFormatters {
  readonly openingMessage: string;
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
  readonly formatAdminLiveChatQueue: (
    sessions: readonly SupportLiveChatSession[],
    page: SupportPaginationPage<SupportLiveChatSession>,
    filterOptions?: {
      readonly activeFilter?: SupportAdminLiveChatQueueFilterOption | undefined;
      readonly filterOptions:
        | readonly SupportAdminLiveChatQueueFilterOption[]
        | undefined;
    }
  ) => string;
  readonly formatAdminLiveChatDetails: (
    session: SupportLiveChatSession
  ) => string;
}

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
