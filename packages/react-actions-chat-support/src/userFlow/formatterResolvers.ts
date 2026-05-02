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

interface CreateUserFlowFormattersOptions {
  readonly config: SupportUserFlowConfig;
  readonly formatterContext: SupportUserFormatterContext;
  readonly brandName: string;
  readonly recentActivityLimit: number;
}

interface UserFlowFormatters {
  readonly openingMessage: string;
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
  readonly formatUserLiveChatDetails: (
    session: SupportLiveChatSession
  ) => string;
  readonly formatUserLiveChatEnded: (session: SupportLiveChatSession) => string;
}

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
