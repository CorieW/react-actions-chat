import type { MessageButton } from 'react-actions-chat';
import type {
  SupportAgentIdentity,
  SupportInputValidationSettings,
  SupportQueueFilter,
  SupportTicket,
  SupportTicketPriority,
} from '../../supportFlowTypes';
import {
  createListFilterButtons,
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
import { getTicketQueueButtonVariant, paginateTickets } from './queue';
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

type CustomizeAdminButtons = (
  context: Omit<SupportAdminFlowButtonContext, 'agent' | 'agentLabel'>
) => readonly MessageButton[];

interface CreateAdminTicketFlowOptions {
  readonly config: SupportAdminFlowConfig;
  readonly agent: SupportAgentIdentity;
  readonly agentLabel: string;
  readonly labels: SupportAdminFlowLabels;
  readonly behavior: NonNullable<SupportAdminFlowConfig['behavior']>;
  readonly formatterContext: SupportAdminFormatterContext;
  readonly statusTransitions: SupportAdminStatusTransitions;
  readonly priorityOrder: readonly SupportTicketPriority[];
  readonly queueLimit: number;
  readonly assignedWorkLimit: number;
  readonly ticketAssignmentValidation: SupportInputValidationSettings;
  readonly ticketReplyValidation: SupportInputValidationSettings;
  readonly canUpdateTicket: boolean;
  readonly canAppendTicketMessage: boolean;
  readonly listTicketQueue: SupportAdminFlowServices['listTicketQueue'];
  readonly getTicket: SupportAdminFlowServices['getTicket'];
  readonly updateTicket: SupportAdminFlowServices['updateTicket'];
  readonly appendTicketMessage: SupportAdminFlowServices['appendTicketMessage'];
  readonly formatAdminTicketDetails: (ticket: SupportTicket) => string;
  readonly formatAdminTicketFullActivity: (ticket: SupportTicket) => string;
  readonly formatAdminTicketQueue: (
    tickets: readonly SupportTicket[],
    page: ReturnType<typeof paginateTickets>,
    filterState?: {
      readonly activeFilter?: SupportAdminTicketQueueFilterOption | undefined;
      readonly filterOptions:
        | readonly SupportAdminTicketQueueFilterOption[]
        | undefined;
    }
  ) => string;
  readonly addSupportMessage: (
    markdown: string,
    buttons: readonly MessageButton[]
  ) => void;
  readonly addAbortRecoveryMessage: (
    markdown: string,
    buttons: readonly MessageButton[]
  ) => void;
  readonly createPrimaryButtons: () => readonly MessageButton[];
  readonly createBackToAdminOptionsButton: () => MessageButton;
  readonly customizeButtons: CustomizeAdminButtons;
}

export interface AdminTicketFlow {
  readonly createReviewTicketButton: () => MessageButton;
  readonly createTicketButtons: (
    ticket: SupportTicket
  ) => readonly MessageButton[];
  readonly showAssignedWork: (
    pageIndex?: number,
    activeFilterId?: string
  ) => Promise<void>;
  readonly showFullActivity: (reference: string) => Promise<void>;
  readonly showTicket: (reference: string) => Promise<void>;
  readonly showTicketQueue: (
    pageIndex?: number,
    activeFilterId?: string
  ) => Promise<void>;
}

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
      updateTicket,
      appendTicketMessage,
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
    tickets: readonly SupportTicket[],
    pageIndex: number,
    pageSize: number,
    showPage: (nextPageIndex: number) => void
  ): readonly MessageButton[] => {
    const page = paginateTickets(tickets, pageIndex, pageSize);

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
    readonly slot: SupportAdminTicketQueueFilterSlot;
    readonly activeFilterId: string | undefined;
    readonly baseFilter?: SupportQueueFilter | undefined;
  }): {
    readonly filterOptions: readonly SupportAdminTicketQueueFilterOption[];
    readonly activeFilter: SupportAdminTicketQueueFilterOption | undefined;
    readonly filterContext: SupportAdminTicketQueueFilterContext;
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
    });
    const isFiltered = Boolean(activeFilter?.filter ?? activeFilter?.predicate);
    const tickets = applyTicketFilterPredicate(
      await listTicketQueue(queueFilter),
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
                  void showTicketQueue(nextPageIndex, activeFilter?.id);
                },
              }),
              createBackToAdminOptionsButton(),
            ]
          : createPrimaryButtons()
      );
      return;
    }

    const page = paginateTickets(tickets, pageIndex, queueLimit);
    const defaultButtons = [
      ...filterButtons,
      ...createTicketQueueButtons(
        tickets,
        page.pageIndex,
        queueLimit,
        nextPageIndex => {
          void showTicketQueue(nextPageIndex, activeFilter?.id);
        }
      ),
      createRefreshTicketQueueButton({
        labels,
        pageIndex: page.pageIndex,
        showTicketQueue: nextPageIndex => {
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
    });
    const isFiltered = Boolean(activeFilter?.filter ?? activeFilter?.predicate);
    const tickets = applyTicketFilterPredicate(
      await listTicketQueue(queueFilter),
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
                  void showTicketQueue();
                },
              }),
              createBackToAdminOptionsButton(),
            ]
          : createPrimaryButtons()
      );
      return;
    }

    const page = paginateTickets(tickets, pageIndex, assignedWorkLimit);
    const assignedWorkButtons = [
      ...filterButtons,
      ...createTicketQueueButtons(
        tickets,
        page.pageIndex,
        assignedWorkLimit,
        nextPageIndex => {
          void showAssignedWork(nextPageIndex, activeFilter?.id);
        }
      ),
      createViewTicketQueueButton({
        labels,
        showTicketQueue: () => {
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
