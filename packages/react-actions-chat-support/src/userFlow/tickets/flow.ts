import type { MessageButton } from 'react-actions-chat';
import type {
  SupportInputValidationSettings,
  SupportTicket,
  SupportUserIdentity,
} from '../../supportFlowTypes';
import {
  createListFilterButtons,
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

type CustomizeUserButtons = (
  context: Omit<SupportUserFlowButtonContext, 'customer'>
) => readonly MessageButton[];

interface CreateUserTicketFlowOptions {
  readonly config: SupportUserFlowConfig;
  readonly customer: SupportUserIdentity;
  readonly labels: SupportUserFlowLabels;
  readonly formatterContext: SupportUserFormatterContext;
  readonly ticketListLimit?: number | undefined;
  readonly ticketSummaryValidation: SupportInputValidationSettings;
  readonly ticketDetailValidation: SupportInputValidationSettings;
  readonly canCreateTicket: boolean;
  readonly canListTickets: boolean;
  readonly canAppendTicketMessage: boolean;
  readonly createTicket: SupportUserFlowServices['createTicket'];
  readonly getTicket: SupportUserFlowServices['getTicket'];
  readonly listTickets: SupportUserFlowServices['listTickets'];
  readonly appendTicketMessage: SupportUserFlowServices['appendTicketMessage'];
  readonly formatUserTicketSummary: (ticket: SupportTicket) => string;
  readonly formatUserTicketFullActivity: (ticket: SupportTicket) => string;
  readonly formatUserTicketList: (
    tickets: readonly SupportTicket[],
    page: SupportPaginationPage<SupportTicket>,
    filterState?: {
      readonly activeFilter?: SupportUserTicketFilterOption | undefined;
      readonly filterOptions:
        | readonly SupportUserTicketFilterOption[]
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
  readonly createPrimaryButtons: (
    tickets?: readonly SupportTicket[],
    isTicketListPending?: boolean
  ) => readonly MessageButton[];
  readonly createBackToSupportOptionsButton: () => MessageButton;
  readonly customizeButtons: CustomizeUserButtons;
}

export interface UserTicketFlow {
  readonly createOpenTicketButton: () => MessageButton;
  readonly createTicketButtons: (
    ticket: SupportTicket
  ) => readonly MessageButton[];
  readonly createViewTicketsButton: () => MessageButton;
  readonly showFullActivity: (reference: string) => Promise<void>;
  readonly showMyTickets: (
    pageIndex?: number,
    activeFilterId?: string
  ) => Promise<void>;
  readonly showTicket: (reference: string) => Promise<void>;
}

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
    const tickets = applyTicketFilterPredicate(
      await listTickets(),
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

    const page = paginateItems(tickets, pageIndex, ticketListLimit);
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
