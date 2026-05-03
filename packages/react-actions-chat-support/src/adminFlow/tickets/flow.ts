import type { MessageButton } from 'react-actions-chat';
import type {
  SupportAgentIdentity,
  SupportInputValidationSettings,
  SupportQueueFilter,
  SupportTicket,
  SupportTicketListRequest,
  SupportTicketListResult,
  SupportTicketPriority,
} from '../../supportFlowTypes';
import {
  collectFilteredSupportTicketListPage,
  createPaginationPage,
  createSupportTicketListRequest,
  createListFilterButtons,
  getSupportTicketListNextOffset,
  getSupportTicketListPageSize,
  getSupportTicketListTickets,
  hasSupportTicketListNextPage,
  isSupportTicketListResult,
  normalizeReference,
  resolveActiveListFilter,
} from '../../supportFlowUtils';
import { formatAssignedWorkEmptyMessage } from './actionMessages';
import {
  createAdminAssignButton,
  createAdminAssignToAgentButton,
  createAdminReplyButton,
  createAdminResolveButton,
  createAdminReviewTicketButton,
  createAdminSetPriorityButton,
  createAdminTicketButtons,
} from './buttons';
import {
  createRefreshTicketQueueButton,
  createTicketPaginationButtons,
  createTicketReferenceButtons,
  createViewTicketQueueButton,
} from './queueButtons';
import {
  createAdminTicketPage,
  getTicketQueueButtonVariant,
  paginateTickets,
} from './queue';
import type { SupportAdminFlowServices } from '../services';
import type {
  SupportAdminFlowButtonContext,
  SupportAdminFlowConfig,
  SupportAdminFlowLabels,
  SupportAdminFormatterContext,
  SupportAdminStatusTransitions,
  SupportAdminTicketQueueFilterContext,
  SupportAdminTicketQueueFilterOption,
  SupportAdminTicketQueueFilterSlot,
} from '../types';

/**
 * Button customization hook scoped to admin flow internals.
 *
 * @param context - Context object available to this resolver.
 */
type CustomizeAdminButtons = (
  context: Omit<SupportAdminFlowButtonContext, 'agent' | 'agentLabel'>
) => readonly MessageButton[];

/**
 * Options used to create admin ticket flow.
 */
interface CreateAdminTicketFlowOptions {
  /**
   * Flow or component configuration for this contract.
   */
  readonly config: SupportAdminFlowConfig;
  /**
   * Support agent identity used by this flow or helper.
   */
  readonly agent: SupportAgentIdentity;
  /**
   * Display label for the support agent in generated messages.
   */
  readonly agentLabel: string;
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportAdminFlowLabels;
  /**
   * Input behavior settings applied by the flow.
   */
  readonly behavior: NonNullable<SupportAdminFlowConfig['behavior']>;
  /**
   * Shared context passed to formatter functions.
   */
  readonly formatterContext: SupportAdminFormatterContext;
  /**
   * Ticket status transitions applied by admin actions.
   */
  readonly statusTransitions: SupportAdminStatusTransitions;
  /**
   * Priority ordering used for queue sorting and select options.
   */
  readonly priorityOrder: readonly SupportTicketPriority[];
  /**
   * Maximum number of queued records shown by the admin flow.
   */
  readonly queueLimit?: number | undefined;
  /**
   * Maximum number of assigned tickets shown in the admin flow.
   */
  readonly assignedWorkLimit?: number | undefined;
  /**
   * Validation settings for ticket-assignment input.
   */
  readonly ticketAssignmentValidation: SupportInputValidationSettings;
  /**
   * Validation settings for ticket-reply input.
   */
  readonly ticketReplyValidation: SupportInputValidationSettings;
  /**
   * Whether ticket updates are available.
   */
  readonly canUpdateTicket: boolean;
  /**
   * Whether ticket message append actions are available.
   */
  readonly canAppendTicketMessage: boolean;
  /**
   * Service used to list ticket queue entries.
   */
  readonly listTicketQueue: SupportAdminFlowServices['listTicketQueue'];
  /**
   * Service used to retrieve a support ticket.
   */
  readonly getTicket: SupportAdminFlowServices['getTicket'];
  /**
   * Service used to update a support ticket.
   */
  readonly updateTicket: SupportAdminFlowServices['updateTicket'];
  /**
   * Service used to append a message to a support ticket.
   */
  readonly appendTicketMessage: SupportAdminFlowServices['appendTicketMessage'];
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
   * @param filterState - Current filter state for the rendered list.
   */
  readonly formatAdminTicketQueue: (
    tickets: readonly SupportTicket[],
    page: ReturnType<typeof paginateTickets>,
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
  ) => string;
  /**
   * Adds a support markdown message to the transcript.
   *
   * @param markdown - Markdown message body to add.
   * @param buttons - Buttons to render, store, or customize.
   */
  readonly addSupportMessage: (
    markdown: string,
    buttons: readonly MessageButton[]
  ) => void;
  /**
   * Adds a recovery message after a request-input flow is aborted.
   *
   * @param markdown - Markdown message body to add.
   * @param buttons - Buttons to render, store, or customize.
   */
  readonly addAbortRecoveryMessage: (
    markdown: string,
    buttons: readonly MessageButton[]
  ) => void;
  /**
   * Factory used to create the primary flow action buttons.
   */
  readonly createPrimaryButtons: () => readonly MessageButton[];
  /**
   * Factory used to create the admin options navigation button.
   */
  readonly createBackToAdminOptionsButton: () => MessageButton;
  /**
   * Hook used to customize admin ticket buttons before rendering.
   */
  readonly customizeButtons: CustomizeAdminButtons;
}

/**
 * Runtime API returned by the admin ticket factory.
 */
export interface AdminTicketFlow {
  /**
   * Factory used to create the review-ticket action button.
   */
  readonly createReviewTicketButton: () => MessageButton;
  /**
   * Creates ticket action buttons.
   *
   * @param ticket - Support ticket to inspect or render.
   */
  readonly createTicketButtons: (
    ticket: SupportTicket
  ) => readonly MessageButton[];
  /**
   * Shows assigned work.
   *
   * @param pageIndex - Zero-based page index to show.
   * @param activeFilterId - Identifier of the active filter.
   */
  readonly showAssignedWork: (
    pageIndex?: number,
    activeFilterId?: string
  ) => Promise<void>;
  /**
   * Shows full ticket activity.
   *
   * @param reference - Ticket reference to look up.
   */
  readonly showFullActivity: (reference: string) => Promise<void>;
  /**
   * Shows a support ticket.
   *
   * @param reference - Ticket reference to look up.
   */
  readonly showTicket: (reference: string) => Promise<void>;
  /**
   * Shows the ticket queue.
   *
   * @param pageIndex - Zero-based page index to show.
   * @param activeFilterId - Identifier of the active filter.
   */
  readonly showTicketQueue: (
    pageIndex?: number,
    activeFilterId?: string
  ) => Promise<void>;
}

/**
 * Runtime API returned by the admin ticket workflow factory.
 *
 * @param options - Options for creating the admin ticket flow.
 */
export function createAdminTicketFlow({
  config,
  agent,
  agentLabel,
  labels,
  behavior,
  formatterContext,
  statusTransitions,
  priorityOrder,
  queueLimit,
  assignedWorkLimit,
  ticketAssignmentValidation,
  ticketReplyValidation,
  canUpdateTicket,
  canAppendTicketMessage,
  listTicketQueue,
  getTicket,
  updateTicket,
  appendTicketMessage,
  formatAdminTicketDetails,
  formatAdminTicketFullActivity,
  formatAdminTicketQueue,
  addSupportMessage,
  addAbortRecoveryMessage,
  createPrimaryButtons,
  createBackToAdminOptionsButton,
  customizeButtons,
}: CreateAdminTicketFlowOptions): AdminTicketFlow {
  const isTicketResolved = (ticket: SupportTicket): boolean => {
    return (
      behavior.isTicketResolved?.(ticket) ??
      (ticket.status === 'resolved' || ticket.status === 'closed')
    );
  };
  const ticketPageOffsets = new Map<string, number>();

  const resetTicketPageOffsets = (): void => {
    ticketPageOffsets.clear();
  };

  const getTicketPageKey = (
    slot: SupportAdminTicketQueueFilterSlot,
    activeFilterId: string | undefined,
    pageIndex: number
  ): string => {
    return `${slot}:${activeFilterId ?? 'all'}:${pageIndex}`;
  };

  const createTicketListRequest = (
    slot: SupportAdminTicketQueueFilterSlot,
    pageIndex: number,
    activeFilterId: string | undefined,
    pageSize: number | undefined
  ): SupportTicketListRequest => {
    if (pageIndex <= 0) {
      resetTicketPageOffsets();
    }

    const offset =
      pageIndex <= 0
        ? 0
        : (ticketPageOffsets.get(
            getTicketPageKey(slot, activeFilterId, pageIndex)
          ) ?? pageIndex * (pageSize ?? 0));

    return createSupportTicketListRequest(pageIndex, offset, pageSize);
  };

  const rememberTicketListPage = (
    slot: SupportAdminTicketQueueFilterSlot,
    activeFilterId: string | undefined,
    request: SupportTicketListRequest,
    result: SupportTicketListResult
  ): void => {
    ticketPageOffsets.set(
      getTicketPageKey(slot, activeFilterId, request.pageIndex),
      request.offset
    );

    const nextOffset = getSupportTicketListNextOffset(request, result);

    if (nextOffset !== undefined) {
      ticketPageOffsets.set(
        getTicketPageKey(slot, activeFilterId, request.pageIndex + 1),
        nextOffset
      );
    }
  };

  const updateTicketWithOffsetReset: SupportAdminFlowServices['updateTicket'] =
    async input => {
      const ticket = await updateTicket(input);
      resetTicketPageOffsets();

      return ticket;
    };

  const appendTicketMessageWithOffsetReset: SupportAdminFlowServices['appendTicketMessage'] =
    async input => {
      const ticket = await appendTicketMessage(input);
      resetTicketPageOffsets();

      return ticket;
    };

  const createTicketButtonEnvironment = () => {
    return {
      agent,
      agentLabel,
      labels,
      formatterContext,
      formatters: config.formatters,
      requestInputs: config.requestInputs,
      confirmations: config.confirmations,
      statusTransitions,
      priorityOrder,
      ticketAssignmentValidation,
      ticketReplyValidation,
      isTicketResolved,
      updateTicket: updateTicketWithOffsetReset,
      appendTicketMessage: appendTicketMessageWithOffsetReset,
      addSupportMessage,
      addAbortRecoveryMessage,
      createTicketButtons,
      createPrimaryButtons,
      showTicket,
    };
  };

  const createTicketButtons = (
    ticket: SupportTicket
  ): readonly MessageButton[] => {
    return createAdminTicketButtons({
      ticket,
      labels,
      canUpdateTicket,
      canAppendTicketMessage,
      createAssignButton: adminTicket => {
        return createAdminAssignButton({
          ...createTicketButtonEnvironment(),
          ticket: adminTicket,
        });
      },
      createAssignToAgentButton: adminTicket => {
        return createAdminAssignToAgentButton({
          ...createTicketButtonEnvironment(),
          ticket: adminTicket,
        });
      },
      createSetPriorityButton: adminTicket => {
        return createAdminSetPriorityButton({
          ...createTicketButtonEnvironment(),
          ticket: adminTicket,
        });
      },
      createReplyButton: adminTicket => {
        return createAdminReplyButton({
          ...createTicketButtonEnvironment(),
          ticket: adminTicket,
        });
      },
      createResolveButton: adminTicket => {
        return createAdminResolveButton({
          ...createTicketButtonEnvironment(),
          ticket: adminTicket,
        });
      },
      createBackToAdminOptionsButton,
      showFullActivity: reference => {
        void showFullActivity(reference);
      },
      customizeButtons,
    });
  };

  const showTicket = async (reference: string): Promise<void> => {
    const ticket = await getTicket(normalizeReference(reference));

    if (!ticket) {
      addSupportMessage(
        `Ticket ${normalizeReference(reference)} was not found in the support queue.`,
        createPrimaryButtons()
      );
      return;
    }

    addSupportMessage(
      formatAdminTicketDetails(ticket),
      createTicketButtons(ticket)
    );
  };

  const showFullActivity = async (reference: string): Promise<void> => {
    const ticket = await getTicket(normalizeReference(reference));

    if (!ticket) {
      addSupportMessage(
        `Ticket ${normalizeReference(reference)} was not found in the support queue.`,
        createPrimaryButtons()
      );
      return;
    }

    addSupportMessage(
      formatAdminTicketFullActivity(ticket),
      createTicketButtons(ticket)
    );
  };

  const createTicketQueueButtons = (
    page: ReturnType<typeof paginateTickets>,
    showPage: (nextPageIndex: number) => void
  ): readonly MessageButton[] => {
    return [
      ...createTicketReferenceButtons({
        tickets: page.visibleTickets,
        getVariant: ticket =>
          behavior.getTicketQueueButtonVariant?.(ticket) ??
          getTicketQueueButtonVariant(ticket),
        showTicket: reference => {
          void showTicket(reference);
        },
      }),
      ...createTicketPaginationButtons({
        page,
        labels,
        showPage,
      }),
    ];
  };

  const mergeQueueFilters = (
    baseFilter: SupportQueueFilter | undefined,
    activeFilter: SupportQueueFilter | undefined
  ): SupportQueueFilter | undefined => {
    if (!baseFilter) {
      return activeFilter;
    }

    if (!activeFilter) {
      return baseFilter;
    }

    return {
      ...baseFilter,
      ...activeFilter,
      ...(baseFilter.assignedTo !== undefined
        ? { assignedTo: baseFilter.assignedTo }
        : {}),
    };
  };

  const resolveTicketFilter = (
    activeFilter: SupportAdminTicketQueueFilterOption | undefined,
    filterContext: SupportAdminTicketQueueFilterContext
  ): SupportQueueFilter | undefined => {
    if (!activeFilter?.filter) {
      return undefined;
    }

    return typeof activeFilter.filter === 'function'
      ? activeFilter.filter(filterContext)
      : activeFilter.filter;
  };

  const applyTicketFilterPredicate = (
    tickets: readonly SupportTicket[],
    activeFilter: SupportAdminTicketQueueFilterOption | undefined,
    filterContext: SupportAdminTicketQueueFilterContext
  ): readonly SupportTicket[] => {
    const predicate = activeFilter?.predicate;

    if (!predicate) {
      return tickets;
    }

    return tickets.filter(ticket => predicate(ticket, filterContext));
  };

  const getTicketFilterState = ({
    slot,
    activeFilterId,
    baseFilter,
  }: {
    /**
     * Button slot where the override is applied.
     */
    readonly slot: SupportAdminTicketQueueFilterSlot;
    /**
     * Identifier for the currently selected filter option.
     */
    readonly activeFilterId: string | undefined;
    /**
     * Base filter applied before user-selected filters are resolved.
     */
    readonly baseFilter?: SupportQueueFilter | undefined;
  }): {
    /**
     * Filter options available for the current list.
     */
    readonly filterOptions: readonly SupportAdminTicketQueueFilterOption[];
    /**
     * Currently selected filter state for the list.
     */
    readonly activeFilter: SupportAdminTicketQueueFilterOption | undefined;
    /**
     * Filter context value for this contract.
     */
    readonly filterContext: SupportAdminTicketQueueFilterContext;
    /**
     * Queue filter value for this contract.
     */
    readonly queueFilter: SupportQueueFilter | undefined;
  } => {
    const filterOptions =
      slot === 'assigned-work'
        ? (config.filterOptions?.assignedWork ?? [])
        : (config.filterOptions?.ticketQueue ?? []);
    const activeFilter = resolveActiveListFilter(filterOptions, activeFilterId);
    const filterContext: SupportAdminTicketQueueFilterContext = {
      agent,
      agentLabel,
      slot,
      baseFilter,
    };

    return {
      filterOptions,
      activeFilter,
      filterContext,
      queueFilter: mergeQueueFilters(
        baseFilter,
        resolveTicketFilter(activeFilter, filterContext)
      ),
    };
  };

  const showTicketQueue = async (
    pageIndex = 0,
    activeFilterId?: string
  ): Promise<void> => {
    const { filterOptions, activeFilter, filterContext, queueFilter } =
      getTicketFilterState({
        slot: 'ticket-queue',
        activeFilterId,
      });
    const filterButtons = createListFilterButtons({
      filterOptions,
      activeFilterId: activeFilter?.id,
      showFilter: nextFilterId => {
        void showTicketQueue(0, nextFilterId);
      },
      abortFilter: () => {
        void showTicketQueue(pageIndex, activeFilter?.id);
      },
    });
    const isFiltered = Boolean(activeFilter?.filter ?? activeFilter?.predicate);
    const filteredTicketPage = activeFilter?.predicate
      ? await collectFilteredSupportTicketListPage({
          pageIndex,
          pageSize: queueLimit,
          listTickets: request => listTicketQueue(queueFilter, request),
          filterTickets: tickets =>
            applyTicketFilterPredicate(tickets, activeFilter, filterContext),
        })
      : undefined;
    const request = filteredTicketPage
      ? undefined
      : createTicketListRequest(
          'ticket-queue',
          pageIndex,
          activeFilter?.id,
          queueLimit
        );
    const ticketResponse = request
      ? await listTicketQueue(queueFilter, request)
      : undefined;
    const isPagedResponse =
      ticketResponse !== undefined && isSupportTicketListResult(ticketResponse);
    const tickets =
      filteredTicketPage?.tickets ??
      applyTicketFilterPredicate(
        getSupportTicketListTickets(ticketResponse ?? []),
        activeFilter,
        filterContext
      );

    if (!tickets.length) {
      addSupportMessage(
        activeFilter && isFiltered
          ? `No tickets match ${activeFilter.label}.`
          : 'The ticket queue is empty right now.',
        filterButtons.length
          ? [
              ...filterButtons,
              createRefreshTicketQueueButton({
                labels,
                pageIndex: 0,
                showTicketQueue: nextPageIndex => {
                  resetTicketPageOffsets();
                  void showTicketQueue(nextPageIndex, activeFilter?.id);
                },
              }),
              createBackToAdminOptionsButton(),
            ]
          : createPrimaryButtons()
      );
      return;
    }

    const page = filteredTicketPage
      ? createAdminTicketPage(filteredTicketPage.page)
      : isPagedResponse && request
        ? createAdminTicketPage(
            createPaginationPage({
              visibleItems: tickets,
              pageIndex,
              pageSize: getSupportTicketListPageSize(
                request,
                queueLimit,
                ticketResponse.tickets.length
              ),
              offset: request.offset,
              totalItems: ticketResponse.totalTickets,
              hasMoreItems: hasSupportTicketListNextPage(
                request,
                ticketResponse
              ),
            })
          )
        : paginateTickets(tickets, pageIndex, queueLimit);

    if (isPagedResponse && request) {
      rememberTicketListPage(
        'ticket-queue',
        activeFilter?.id,
        request,
        ticketResponse
      );
    }

    const defaultButtons = [
      ...filterButtons,
      ...createTicketQueueButtons(page, nextPageIndex => {
        void showTicketQueue(nextPageIndex, activeFilter?.id);
      }),
      createRefreshTicketQueueButton({
        labels,
        pageIndex: 0,
        showTicketQueue: nextPageIndex => {
          resetTicketPageOffsets();
          void showTicketQueue(nextPageIndex, activeFilter?.id);
        },
      }),
      createBackToAdminOptionsButton(),
    ];

    addSupportMessage(
      formatAdminTicketQueue(tickets, page, {
        activeFilter,
        filterOptions,
      }),
      customizeButtons({
        slot: 'ticket-queue',
        defaultButtons,
        tickets,
        visibleTickets: page.visibleTickets,
        currentPage: page.currentPage,
        pageCount: page.pageCount,
        pageSize: page.pageSize,
        totalTickets: page.totalTickets,
        hasMoreTickets: page.hasMoreTickets,
        isTotalTicketsExact: page.isTotalTicketsExact,
        activeFilterId: activeFilter?.id,
        activeFilterLabel: activeFilter?.label,
        filterOptions,
      })
    );
  };

  const showAssignedWork = async (
    pageIndex = 0,
    activeFilterId?: string
  ): Promise<void> => {
    const baseFilter = behavior.getAssignedWorkFilter?.({
      agent,
      agentLabel,
    }) ?? {
      assignedTo: agentLabel,
    };
    const { filterOptions, activeFilter, filterContext, queueFilter } =
      getTicketFilterState({
        slot: 'assigned-work',
        activeFilterId,
        baseFilter,
      });
    const filterButtons = createListFilterButtons({
      filterOptions,
      activeFilterId: activeFilter?.id,
      showFilter: nextFilterId => {
        void showAssignedWork(0, nextFilterId);
      },
      abortFilter: () => {
        void showAssignedWork(pageIndex, activeFilter?.id);
      },
    });
    const isFiltered = Boolean(activeFilter?.filter ?? activeFilter?.predicate);
    const filteredTicketPage = activeFilter?.predicate
      ? await collectFilteredSupportTicketListPage({
          pageIndex,
          pageSize: assignedWorkLimit,
          listTickets: request => listTicketQueue(queueFilter, request),
          filterTickets: tickets =>
            applyTicketFilterPredicate(tickets, activeFilter, filterContext),
        })
      : undefined;
    const request = filteredTicketPage
      ? undefined
      : createTicketListRequest(
          'assigned-work',
          pageIndex,
          activeFilter?.id,
          assignedWorkLimit
        );
    const ticketResponse = request
      ? await listTicketQueue(queueFilter, request)
      : undefined;
    const isPagedResponse =
      ticketResponse !== undefined && isSupportTicketListResult(ticketResponse);
    const tickets =
      filteredTicketPage?.tickets ??
      applyTicketFilterPredicate(
        getSupportTicketListTickets(ticketResponse ?? []),
        activeFilter,
        filterContext
      );

    if (!tickets.length) {
      addSupportMessage(
        activeFilter && isFiltered
          ? `No assigned tickets match ${activeFilter.label}.`
          : formatAssignedWorkEmptyMessage(agentLabel),
        filterButtons.length
          ? [
              ...filterButtons,
              createViewTicketQueueButton({
                labels,
                showTicketQueue: () => {
                  resetTicketPageOffsets();
                  void showTicketQueue();
                },
              }),
              createBackToAdminOptionsButton(),
            ]
          : createPrimaryButtons()
      );
      return;
    }

    const page = filteredTicketPage
      ? createAdminTicketPage(filteredTicketPage.page)
      : isPagedResponse && request
        ? createAdminTicketPage(
            createPaginationPage({
              visibleItems: tickets,
              pageIndex,
              pageSize: getSupportTicketListPageSize(
                request,
                assignedWorkLimit,
                ticketResponse.tickets.length
              ),
              offset: request.offset,
              totalItems: ticketResponse.totalTickets,
              hasMoreItems: hasSupportTicketListNextPage(
                request,
                ticketResponse
              ),
            })
          )
        : paginateTickets(tickets, pageIndex, assignedWorkLimit);

    if (isPagedResponse && request) {
      rememberTicketListPage(
        'assigned-work',
        activeFilter?.id,
        request,
        ticketResponse
      );
    }

    const assignedWorkButtons = [
      ...filterButtons,
      ...createTicketQueueButtons(page, nextPageIndex => {
        void showAssignedWork(nextPageIndex, activeFilter?.id);
      }),
      createViewTicketQueueButton({
        labels,
        showTicketQueue: () => {
          resetTicketPageOffsets();
          void showTicketQueue();
        },
      }),
      createBackToAdminOptionsButton(),
    ];

    addSupportMessage(
      formatAdminTicketQueue(tickets, page, {
        activeFilter,
        filterOptions,
      }),
      customizeButtons({
        slot: 'assigned-work',
        defaultButtons: assignedWorkButtons,
        tickets,
        visibleTickets: page.visibleTickets,
        currentPage: page.currentPage,
        pageCount: page.pageCount,
        pageSize: page.pageSize,
        totalTickets: page.totalTickets,
        hasMoreTickets: page.hasMoreTickets,
        isTotalTicketsExact: page.isTotalTicketsExact,
        activeFilterId: activeFilter?.id,
        activeFilterLabel: activeFilter?.label,
        filterOptions,
      })
    );
  };

  const createReviewTicketButton = (): MessageButton => {
    return createAdminReviewTicketButton(createTicketButtonEnvironment());
  };

  return {
    createReviewTicketButton,
    createTicketButtons,
    showAssignedWork,
    showFullActivity,
    showTicket,
    showTicketQueue,
  };
}
