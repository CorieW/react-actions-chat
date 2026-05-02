import type { SupportLiveChatSession } from '../../supportFlowTypes';
import type { SupportPaginationPage } from '../../supportFlowUtils';
import type {
  SupportAdminFlowConfig,
  SupportAdminFormatterContext,
  SupportAdminLiveChatQueueFilterOption,
} from '../types';
import {
  formatLiveChatDetails,
  formatLiveChatQueueSummary,
} from './formatters';

interface CreateAdminLiveChatFormattersOptions {
  readonly config: SupportAdminFlowConfig;
  readonly formatterContext: SupportAdminFormatterContext;
  readonly transcriptLimit: number;
}

interface AdminLiveChatFormatters {
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

export function createAdminLiveChatFormatters({
  config,
  formatterContext,
  transcriptLimit,
}: CreateAdminLiveChatFormattersOptions): AdminLiveChatFormatters {
  const formatAdminLiveChatQueue = (
    sessions: readonly SupportLiveChatSession[],
    page: SupportPaginationPage<SupportLiveChatSession>,
    filterState?: {
      readonly activeFilter?: SupportAdminLiveChatQueueFilterOption | undefined;
      readonly filterOptions:
        | readonly SupportAdminLiveChatQueueFilterOption[]
        | undefined;
    }
  ): string => {
    return (
      config.formatters?.liveChatQueue?.({
        ...formatterContext,
        sessions,
        visibleSessions: page.visibleItems,
        currentPage: page.currentPage,
        pageCount: page.pageCount,
        pageSize: page.pageSize,
        totalSessions: page.totalItems,
        activeFilterId: filterState?.activeFilter?.id,
        activeFilterLabel: filterState?.activeFilter?.label,
        filterOptions: filterState?.filterOptions,
      }) ?? formatLiveChatQueueSummary(page)
    );
  };

  const formatAdminLiveChatDetails = (
    session: SupportLiveChatSession
  ): string => {
    return (
      config.formatters?.liveChatDetails?.({
        ...formatterContext,
        session,
      }) ?? formatLiveChatDetails(session, transcriptLimit)
    );
  };

  return {
    formatAdminLiveChatQueue,
    formatAdminLiveChatDetails,
  };
}
