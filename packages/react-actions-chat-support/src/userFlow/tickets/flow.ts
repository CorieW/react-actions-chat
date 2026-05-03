import type { MessageButton } from 'react-actions-chat';
import type {
  SupportInputValidationSettings,
  SupportTicket,
  SupportTicketListRequest,
  SupportTicketListResult,
  SupportUserIdentity,
} from '../../supportFlowTypes';
import {
  createPaginationPage,
  getSupportTicketListTickets,
  createListFilterButtons,
  isSupportTicketListResult,
  normalizeReference,
  paginateItems,
  resolveActiveListFilter,
  type SupportPaginationPage,
} from '../../supportFlowUtils';
import {
  createUserAddDetailButton,
  createUserOpenTicketButton,
  createUserTicketPaginationButtons,
  createUserTicketButtons,
  createUserTicketReferenceButtons,
  createViewTicketsButton,
} from './buttons';
import type { SupportUserFlowServices } from '../services';
import type {
  SupportUserFlowButtonContext,
  SupportUserFlowConfig,
  SupportUserFlowLabels,
  SupportUserFormatterContext,
  SupportUserTicketFilterContext,
  SupportUserTicketFilterOption,
} from '../types';

/**
 * Button customization hook scoped to customer flow internals.
 *
 * @param context - Context object available to this resolver.
 */
type CustomizeUserButtons = (
  context: Omit<SupportUserFlowButtonContext, 'customer'>
) => readonly MessageButton[];

/**
 * Options used to create customer ticket flow.
 */
interface CreateUserTicketFlowOptions {
  /**
   * Flow or component configuration for this contract.
   */
  readonly config: SupportUserFlowConfig;
  /**
   * Customer identity associated with the flow or record.
   */
  readonly customer: SupportUserIdentity;
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportUserFlowLabels;
  /**
   * Shared context passed to formatter functions.
   */
  readonly formatterContext: SupportUserFormatterContext;
  /**
   * Maximum number of customer tickets shown in the flow.
   */
  readonly ticketListLimit?: number | undefined;
  /**
   * Validation settings for ticket-summary input.
   */
  readonly ticketSummaryValidation: SupportInputValidationSettings;
  /**
   * Validation settings for additional ticket details.
   */
  readonly ticketDetailValidation: SupportInputValidationSettings;
  /**
   * Whether ticket creation is available.
   */
  readonly canCreateTicket: boolean;
  /**
   * Whether ticket listing is available.
   */
  readonly canListTickets: boolean;
  /**
   * Whether ticket message append actions are available.
   */
  readonly canAppendTicketMessage: boolean;
  /**
   * Service used to create a support ticket.
   */
  readonly createTicket: SupportUserFlowServices['createTicket'];
  /**
   * Service used to retrieve a support ticket.
   */
  readonly getTicket: SupportUserFlowServices['getTicket'];
  /**
   * Service used to list customer tickets.
   */
  readonly listTickets: SupportUserFlowServices['listTickets'];
  /**
   * Service used to append a message to a support ticket.
   */
  readonly appendTicketMessage: SupportUserFlowServices['appendTicketMessage'];
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
   * @param filterState - Current filter state for the rendered list.
   */
  readonly formatUserTicketList: (
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
   * Creates the primary action buttons for the current state.
   *
   * @param tickets - Support tickets to process.
   * @param isTicketListPending - Whether the ticket list is still loading.
   */
  readonly createPrimaryButtons: (
    tickets?: readonly SupportTicket[],
    isTicketListPending?: boolean
  ) => readonly MessageButton[];
  /**
   * Factory used to create the support options navigation button.
   */
  readonly createBackToSupportOptionsButton: () => MessageButton;
  /**
   * Hook used to customize customer ticket buttons before rendering.
   */
  readonly customizeButtons: CustomizeUserButtons;
}

/**
 * Runtime API returned by the customer ticket factory.
 */
export interface UserTicketFlow {
  /**
   * Factory used to create the open-ticket action button.
   */
  readonly createOpenTicketButton: () => MessageButton;
  /**
   * Creates ticket action buttons.
   *
   * @param ticket - Support ticket to inspect or render.
   */
  readonly createTicketButtons: (
    ticket: SupportTicket
  ) => readonly MessageButton[];
  /**
   * Creates the view tickets button.
   */
  readonly createViewTicketsButton: () => MessageButton;
  /**
   * Shows full ticket activity.
   *
   * @param reference - Ticket reference to look up.
   */
  readonly showFullActivity: (reference: string) => Promise<void>;
  /**
   * Shows the customer ticket list.
   *
   * @param pageIndex - Zero-based page index to show.
   * @param activeFilterId - Identifier of the active filter.
   */
  readonly showMyTickets: (
    pageIndex?: number,
    activeFilterId?: string
  ) => Promise<void>;
  /**
   * Shows a support ticket.
   *
   * @param reference - Ticket reference to look up.
   */
  readonly showTicket: (reference: string) => Promise<void>;
}

/**
 * Runtime API returned by the customer ticket workflow factory.
 *
 * @param options - Options for creating the customer ticket flow.
 */
export function createUserTicketFlow({
  config,
  customer,
  labels,
  formatterContext,
  ticketListLimit,
  ticketSummaryValidation,
  ticketDetailValidation,
  canCreateTicket,
  canListTickets,
  canAppendTicketMessage,
  createTicket,
  getTicket,
  listTickets,
  appendTicketMessage,
  formatUserTicketSummary,
  formatUserTicketFullActivity,
  formatUserTicketList,
  addSupportMessage,
  addAbortRecoveryMessage,
  createPrimaryButtons,
  createBackToSupportOptionsButton,
  customizeButtons,
}: CreateUserTicketFlowOptions): UserTicketFlow {
  const ticketListPageOffsets = new Map<string, number>();

  const getTicketListPageKey = (
    activeFilterId: string | undefined,
    pageIndex: number
  ): string => {
    return `${activeFilterId ?? 'all'}:${pageIndex}`;
  };

  const createTicketListRequest = (
    pageIndex: number,
    activeFilterId: string | undefined
  ): SupportTicketListRequest => {
    const offset =
      pageIndex <= 0
        ? 0
        : (ticketListPageOffsets.get(
            getTicketListPageKey(activeFilterId, pageIndex)
          ) ?? pageIndex * (ticketListLimit ?? 0));

    return {
      pageIndex,
      offset,
      ...(ticketListLimit !== undefined
        ? { pageSize: ticketListLimit, limit: ticketListLimit }
        : {}),
    };
  };

  const rememberTicketListPage = (
    activeFilterId: string | undefined,
    request: SupportTicketListRequest,
    result: SupportTicketListResult
  ): void => {
    ticketListPageOffsets.set(
      getTicketListPageKey(activeFilterId, request.pageIndex),
      request.offset
    );

    if (result.hasMore ?? result.totalTickets !== undefined) {
      ticketListPageOffsets.set(
        getTicketListPageKey(activeFilterId, request.pageIndex + 1),
        result.nextOffset ?? request.offset + result.tickets.length
      );
    }
  };

  const createTicketButtonEnvironment = () => {
    return {
      customer,
      labels,
      formatterContext,
      formatters: config.formatters,
      requestInputs: config.requestInputs,
      ticketSummaryValidation,
      ticketDetailValidation,
      createTicket,
      appendTicketMessage,
      addSupportMessage,
      addAbortRecoveryMessage,
      createTicketButtons,
      createPrimaryButtons: () => createPrimaryButtons(),
    };
  };

  const createTicketButtons = (
    ticket: SupportTicket
  ): readonly MessageButton[] => {
    return createUserTicketButtons({
      ticket,
      labels,
      canAppendTicketMessage,
      canListTickets,
      createAddDetailButton: targetTicket => {
        return createUserAddDetailButton({
          ...createTicketButtonEnvironment(),
          ticket: targetTicket,
        });
      },
      createBackToSupportOptionsButton,
      showTicket: reference => {
        void showTicket(reference);
      },
      showFullActivity: reference => {
        void showFullActivity(reference);
      },
      showMyTickets: () => {
        void showMyTickets();
      },
      customizeButtons,
    });
  };

  const showTicket = async (reference: string): Promise<void> => {
    const ticket = await getTicket(normalizeReference(reference));

    if (!ticket) {
      addSupportMessage(
        `I could not find ticket ${normalizeReference(reference)} yet. Double-check the reference or open a new ticket.`,
        createPrimaryButtons([], false)
      );
      return;
    }

    addSupportMessage(
      formatUserTicketSummary(ticket),
      createTicketButtons(ticket)
    );
  };

  const showFullActivity = async (reference: string): Promise<void> => {
    const ticket = await getTicket(normalizeReference(reference));

    if (!ticket) {
      addSupportMessage(
        `I could not find ticket ${normalizeReference(reference)} yet. Double-check the reference or open a new ticket.`,
        createPrimaryButtons()
      );
      return;
    }

    addSupportMessage(
      formatUserTicketFullActivity(ticket),
      createTicketButtons(ticket)
    );
  };

  const applyTicketFilterPredicate = (
    tickets: readonly SupportTicket[],
    activeFilter: SupportUserTicketFilterOption | undefined,
    filterContext: SupportUserTicketFilterContext
  ): readonly SupportTicket[] => {
    const predicate = activeFilter?.predicate;

    if (!predicate) {
      return tickets;
    }

    return tickets.filter(ticket => predicate(ticket, filterContext));
  };

  const showMyTickets = async (
    pageIndex = 0,
    activeFilterId?: string
  ): Promise<void> => {
    const filterOptions = config.filterOptions?.tickets ?? [];
    const activeFilter = resolveActiveListFilter(filterOptions, activeFilterId);
    const filterContext: SupportUserTicketFilterContext = {
      customer,
    };
    const filterButtons = createListFilterButtons({
      filterOptions,
      activeFilterId: activeFilter?.id,
      showFilter: nextFilterId => {
        void showMyTickets(0, nextFilterId);
      },
      abortFilter: () => {
        void showMyTickets(pageIndex, activeFilter?.id);
      },
    });
    const isFiltered = Boolean(activeFilter?.predicate);
    const request = createTicketListRequest(pageIndex, activeFilter?.id);
    const ticketResponse = await listTickets(request);
    const isPagedResponse = isSupportTicketListResult(ticketResponse);
    const tickets = applyTicketFilterPredicate(
      getSupportTicketListTickets(ticketResponse),
      activeFilter,
      filterContext
    );

    if (!tickets.length) {
      addSupportMessage(
        activeFilter && isFiltered
          ? `No tickets match ${activeFilter.label}.`
          : 'You do not have any tickets yet. Open one whenever you want a tracked follow-up.',
        filterButtons.length
          ? [
              ...filterButtons,
              ...(canCreateTicket ? [createOpenTicketButton()] : []),
              createBackToSupportOptionsButton(),
            ]
          : createPrimaryButtons([], false)
      );
      return;
    }

    const page = isPagedResponse
      ? createPaginationPage({
          visibleItems: tickets,
          pageIndex,
          pageSize: ticketResponse.tickets.length || ticketListLimit,
          offset: request.offset,
          totalItems: ticketResponse.totalTickets,
          hasMoreItems: ticketResponse.hasMore,
        })
      : paginateItems(tickets, pageIndex, ticketListLimit);

    if (isPagedResponse) {
      rememberTicketListPage(activeFilter?.id, request, ticketResponse);
    }

    const visibleTickets = page.visibleItems;
    const defaultButtons = [
      ...filterButtons,
      ...createUserTicketReferenceButtons({
        tickets: visibleTickets,
        showTicket: reference => {
          void showTicket(reference);
        },
      }),
      ...createUserTicketPaginationButtons({
        page,
        labels,
        showPage: nextPageIndex => {
          void showMyTickets(nextPageIndex, activeFilter?.id);
        },
      }),
      ...(canCreateTicket ? [createOpenTicketButton()] : []),
      createBackToSupportOptionsButton(),
    ];

    addSupportMessage(
      formatUserTicketList(tickets, page, {
        activeFilter,
        filterOptions,
      }),
      customizeButtons({
        slot: 'ticket-list',
        defaultButtons,
        tickets,
        visibleTickets,
        currentPage: page.currentPage,
        pageCount: page.pageCount,
        pageSize: page.pageSize,
        totalTickets: page.totalItems,
        hasMoreTickets: page.hasMoreItems,
        isTotalTicketsExact: page.isTotalItemsExact,
        activeFilterId: activeFilter?.id,
        activeFilterLabel: activeFilter?.label,
        filterOptions,
      })
    );
  };

  const createOpenTicketButton = (): MessageButton => {
    return createUserOpenTicketButton(createTicketButtonEnvironment());
  };

  const createViewTickets = (): MessageButton => {
    return createViewTicketsButton({
      labels,
      showMyTickets: () => {
        void showMyTickets();
      },
    });
  };

  return {
    createOpenTicketButton,
    createTicketButtons,
    createViewTicketsButton: createViewTickets,
    showFullActivity,
    showMyTickets,
    showTicket,
  };
}
