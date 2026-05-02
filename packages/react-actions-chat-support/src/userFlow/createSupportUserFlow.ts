import {
  createMarkdownTextPart,
  type InputMessage,
  type InputSubmission,
  type MessageButton,
  useChatStore,
} from 'react-actions-chat';
import { isOpenLiveChat, resolveValidationSettings } from '../supportFlowUtils';
import {
  createBackToSupportOptionsButton as createBackToSupportOptionsButtonBase,
  createRefreshLiveChatButton as createRefreshLiveChatButtonBase,
} from './buttons/navigationButtons';
import { createUserPrimaryButtons } from './buttons/primaryButtons';
import { DEFAULT_USER_LABELS } from './defaults';
import { createUserFlowFormatters } from './formatterResolvers';
import {
  createUserLiveChatFlow,
  type UserLiveChatFlow,
} from './live-chat/flow';
import { createSupportUserFlowServices } from './services';
import { createUserTicketFlow, type UserTicketFlow } from './tickets/flow';
import type {
  SupportUserFlow,
  SupportUserFlowButtonContext,
  SupportUserFlowConfig,
  SupportUserFormatterContext,
} from './types';
import type { SupportTicket } from '../supportFlowTypes';

export function createSupportUserFlow(
  config: SupportUserFlowConfig
): SupportUserFlow {
  const {
    adapter,
    callbacks = {},
    customer,
    brandName = 'Support desk',
  } = config;
  const labels = {
    ...DEFAULT_USER_LABELS,
    ...config.labels,
  };
  const behavior = config.behavior ?? {};
  const recentActivityLimit = behavior.recentActivityLimit ?? 3;
  const ticketListLimit = behavior.ticketListLimit ?? 4;
  const formatterContext: SupportUserFormatterContext = {
    customer,
    brandName,
    recentActivityLimit,
    ticketListLimit,
  };

  const {
    openingMessage,
    formatUserTicketSummary,
    formatUserTicketFullActivity,
    formatUserTicketList,
    formatUserLiveChatDetails,
    formatUserLiveChatEnded,
  } = createUserFlowFormatters({
    config,
    formatterContext,
    brandName,
    recentActivityLimit,
  });
  const validation = config.validation ?? {};
  const ticketSummaryValidation = resolveValidationSettings(
    {
      minMessageLength: 12,
      minMessageLengthMessage:
        'Please share a little more detail so the ticket is actionable.',
    },
    validation.ticketSummary
  );
  const ticketDetailValidation = resolveValidationSettings(
    {
      minMessageLength: 10,
      minMessageLengthMessage:
        'Please add a little more detail so the support team can act on it.',
    },
    validation.ticketDetail
  );
  const liveChatInitialMessageValidation = resolveValidationSettings(
    {
      minMessageLength: 10,
      minMessageLengthMessage:
        'Please include a little more context so the handoff is useful.',
    },
    validation.liveChatInitialMessage
  );
  const liveChatMessageValidation = resolveValidationSettings(
    {
      minMessageLength: 1,
    },
    validation.liveChatMessage
  );

  const {
    canCreateTicket,
    canListTickets,
    canAppendTicketMessage,
    canUseLiveChat,
    canGetLiveChat,
    createTicket,
    getTicket,
    listTickets,
    appendTicketMessage,
    startLiveChat,
    updateLiveChat,
    appendLiveChatMessage,
    getLiveChat,
    getOpenLiveChat,
    readInitialTickets,
  } = createSupportUserFlowServices({
    adapter,
    callbacks,
    customer,
    isOpenLiveChat: behavior.isOpenLiveChat ?? isOpenLiveChat,
  });

  const customizeButtons = (
    context: Omit<SupportUserFlowButtonContext, 'customer'>
  ): readonly MessageButton[] => {
    return (
      config.customizeButtons?.({
        customer,
        ...context,
      }) ?? context.defaultButtons
    );
  };

  const initialTicketList = readInitialTickets();

  const addSupportMessage = (
    markdown: string,
    buttons: readonly MessageButton[] = createPrimaryButtons(),
    userResponseCallback?: (submission?: InputSubmission) => void
  ): void => {
    useChatStore.getState().addMessage({
      type: 'other',
      parts: [createMarkdownTextPart(markdown)],
      buttons,
      ...(userResponseCallback ? { userResponseCallback } : {}),
    });
  };

  const addAbortRecoveryMessage = (
    text: string,
    buttons: readonly MessageButton[] = createPrimaryButtons()
  ): void => {
    addSupportMessage(text, buttons);
  };

  const showInitialOptions = async (): Promise<void> => {
    const tickets = canListTickets ? await listTickets() : [];
    addSupportMessage(openingMessage, createPrimaryButtons(tickets, false));
  };

  const createBackToSupportOptionsButton = (): MessageButton => {
    return createBackToSupportOptionsButtonBase({
      labels,
      showInitialOptions: () => {
        void showInitialOptions();
      },
    });
  };

  const createRefreshLiveChatButton = (sessionId: string): MessageButton => {
    return createRefreshLiveChatButtonBase({
      labels,
      sessionId,
      showLiveChatSession: id => {
        void liveChatFlow.showLiveChatSession(id);
      },
    });
  };

  const ticketFlow: UserTicketFlow = createUserTicketFlow({
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
  });

  const liveChatFlow: UserLiveChatFlow = createUserLiveChatFlow({
    config,
    customer,
    labels,
    behavior,
    formatterContext,
    liveChatInitialMessageValidation,
    liveChatMessageValidation,
    canGetLiveChat,
    startLiveChat,
    updateLiveChat,
    appendLiveChatMessage,
    getLiveChat,
    getOpenLiveChat,
    formatUserLiveChatDetails,
    formatUserLiveChatEnded,
    addSupportMessage,
    addAbortRecoveryMessage,
    createPrimaryButtons,
    createRefreshLiveChatButton,
    customizeButtons,
  });

  function createPrimaryButtons(
    tickets: readonly SupportTicket[] = initialTicketList.tickets,
    isTicketListPending = initialTicketList.isPending
  ): readonly MessageButton[] {
    return createUserPrimaryButtons({
      tickets,
      isTicketListPending,
      canCreateTicket,
      canUseLiveChat,
      canListTickets,
      createOpenTicketButton: ticketFlow.createOpenTicketButton,
      createLiveChatButton: liveChatFlow.createLiveChatButton,
      createViewTicketsButton: ticketFlow.createViewTicketsButton,
      customizeButtons,
    });
  }

  const initialMessages: readonly InputMessage[] = [
    {
      type: 'other',
      parts: [createMarkdownTextPart(openingMessage)],
      buttons: createPrimaryButtons(),
    },
  ];

  return {
    initialMessages,
    primaryButtons: createPrimaryButtons(),
    start: () => {
      void (async () => {
        const didRedirect = await liveChatFlow.redirectToOpenLiveChat();

        if (!didRedirect) {
          await showInitialOptions();
        }
      })();
    },
  };
}
