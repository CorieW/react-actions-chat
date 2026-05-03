import {
  createMarkdownTextPart,
  type InputMessage,
  type InputSubmission,
  type MessageButton,
  useChatStore,
} from 'react-actions-chat';
import { deriveAgentLabel } from '../supportFlowUtils';
import {
  createBackToAdminOptionsButton as createBackToAdminOptionsButtonBase,
  createRefreshLiveChatButton as createRefreshLiveChatButtonBase,
} from './buttons/navigationButtons';
import { createAdminPrimaryButtons } from './buttons/primaryButtons';
import { DEFAULT_ADMIN_LABELS, DEFAULT_PRIORITY_ORDER } from './defaults';
import { createAdminFlowFormatters } from './formatterResolvers';
import {
  createAdminLiveChatFlow,
  type AdminLiveChatFlow,
} from './live-chat/flow';
import { createSupportAdminFlowServices } from './services';
import { createAdminTicketFlow, type AdminTicketFlow } from './tickets/flow';
import type {
  SupportAdminFlow,
  SupportAdminFlowButtonContext,
  SupportAdminFlowConfig,
  SupportAdminFormatterContext,
} from './types';

/**
 * Creates the admin-side support workflow from adapter, callbacks, labels, and behavior.
 *
 * @param config - Admin support flow configuration, including adapter, callbacks, labels, and behavior.
 */
export function createSupportAdminFlow(
  config: SupportAdminFlowConfig
): SupportAdminFlow {
  const {
    adapter,
    callbacks = {},
    agent,
    brandName = 'Support operations',
  } = config;
  const agentLabel = deriveAgentLabel(agent);
  const labels = {
    ...DEFAULT_ADMIN_LABELS,
    ...config.labels,
  };
  const behavior = config.behavior ?? {};
  const queueLimit = behavior.queueLimit;
  const liveChatQueueLimit = behavior.liveChatQueueLimit;
  const assignedWorkLimit = behavior.assignedWorkLimit;
  const recentActivityLimit = behavior.recentActivityLimit;
  const transcriptLimit = behavior.transcriptLimit;
  const priorityOrder = behavior.priorityOrder ?? DEFAULT_PRIORITY_ORDER;
  const statusTransitions = behavior.statusTransitions ?? {};
  const {
    capabilities,
    listTicketQueue,
    listLiveChatQueue,
    getTicket,
    updateTicket,
    appendTicketMessage,
    getLiveChat,
    updateLiveChat,
    appendLiveChatMessage,
  } = createSupportAdminFlowServices({
    adapter,
    callbacks,
  });
  const {
    canListTicketQueue,
    canGetTicket,
    canUpdateTicket,
    canAppendTicketMessage,
    canUpdateLiveChat,
    canAppendLiveChatMessage,
    canOpenLiveChatQueue,
  } = capabilities;
  const formatterContext: SupportAdminFormatterContext = {
    agent,
    agentLabel,
    brandName,
    labels,
    capabilities,
    ...(queueLimit !== undefined ? { queueLimit } : {}),
    ...(liveChatQueueLimit !== undefined ? { liveChatQueueLimit } : {}),
    ...(assignedWorkLimit !== undefined ? { assignedWorkLimit } : {}),
    ...(recentActivityLimit !== undefined ? { recentActivityLimit } : {}),
    ...(transcriptLimit !== undefined ? { transcriptLimit } : {}),
  };
  const {
    openingMessage,
    formatAdminTicketDetails,
    formatAdminTicketFullActivity,
    formatAdminTicketQueue,
    formatAdminLiveChatQueue,
    formatAdminLiveChatDetails,
  } = createAdminFlowFormatters({
    config,
    formatterContext,
    recentActivityLimit,
    transcriptLimit,
  });
  const validation = config.validation ?? {};
  const ticketAssignmentValidation = validation.ticketAssignment ?? {};
  const ticketReplyValidation = validation.ticketReply ?? {};
  const liveChatMessageValidation = validation.liveChatMessage ?? {};

  const customizeButtons = (
    context: Omit<SupportAdminFlowButtonContext, 'agent' | 'agentLabel'>
  ): readonly MessageButton[] => {
    return (
      config.customizeButtons?.({
        agent,
        agentLabel,
        ...context,
      }) ?? context.defaultButtons
    );
  };

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

  const showInitialOptions = (): void => {
    liveChatFlow.resetLiveChatState();
    addSupportMessage(openingMessage, createPrimaryButtons());
  };

  const createBackToAdminOptionsButton = (): MessageButton => {
    return createBackToAdminOptionsButtonBase({
      labels,
      showInitialOptions,
    });
  };

  const createRefreshLiveChatButton = (sessionId: string): MessageButton => {
    return createRefreshLiveChatButtonBase({
      labels,
      sessionId,
      showLiveChat: id => {
        void liveChatFlow.showLiveChat(id);
      },
    });
  };

  const ticketFlow: AdminTicketFlow = createAdminTicketFlow({
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
  });

  const liveChatFlow: AdminLiveChatFlow = createAdminLiveChatFlow({
    config,
    agent,
    agentLabel,
    labels,
    behavior,
    formatterContext,
    liveChatQueueLimit,
    liveChatMessageValidation,
    canUpdateLiveChat,
    canAppendLiveChatMessage,
    canGetTicket,
    canOpenLiveChatQueue,
    listLiveChatQueue,
    getLiveChat,
    updateLiveChat,
    appendLiveChatMessage,
    formatAdminLiveChatQueue,
    formatAdminLiveChatDetails,
    addSupportMessage,
    createPrimaryButtons,
    createRefreshLiveChatButton,
    createBackToAdminOptionsButton,
    showTicket: ticketFlow.showTicket,
    customizeButtons,
  });

  function createPrimaryButtons(): readonly MessageButton[] {
    return createAdminPrimaryButtons({
      labels,
      canListTicketQueue,
      canOpenLiveChatQueue,
      canGetTicket,
      createReviewTicketButton: ticketFlow.createReviewTicketButton,
      showTicketQueue: () => {
        void ticketFlow.showTicketQueue();
      },
      showLiveChatQueue: () => {
        void liveChatFlow.showLiveChatQueue();
      },
      showAssignedWork: () => {
        void ticketFlow.showAssignedWork();
      },
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
      addSupportMessage(openingMessage, createPrimaryButtons());
    },
  };
}
