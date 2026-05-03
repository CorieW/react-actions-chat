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

/**
 * Options used to create admin live chat formatters.
 */
interface CreateAdminLiveChatFormattersOptions {
  /**
   * Flow or component configuration for this contract.
   */
  readonly config: SupportAdminFlowConfig;
  /**
   * Shared context passed to formatter functions.
   */
  readonly formatterContext: SupportAdminFormatterContext;
  /**
   * Maximum number of transcript messages included in formatted output.
   */
  readonly transcriptLimit?: number | undefined;
}

/**
 * Formatter overrides for messages produced by the admin live chat.
 */
interface AdminLiveChatFormatters {
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
 * Formatter overrides for messages produced by the admin live chat flow.
 *
 * @param options - Options for creating the admin live chat formatters.
 */
export function createAdminLiveChatFormatters({
  config,
  formatterContext,
  transcriptLimit,
}: CreateAdminLiveChatFormattersOptions): AdminLiveChatFormatters {
  const formatAdminLiveChatQueue = (
    sessions: readonly SupportLiveChatSession[],
    page: SupportPaginationPage<SupportLiveChatSession>,
    filterState?: {
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
