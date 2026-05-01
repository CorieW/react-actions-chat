import {
  createButton,
  createMarkdownTextPart,
  createRequestConfirmationButtonDef,
  createRequestInputButtonDef,
  type InputMessage,
  type InputSubmission,
  type MessageButton,
  useChatStore,
  useInputFieldStore,
  usePersistentButtonStore,
} from 'react-actions-chat';
import type {
  AppendSupportLiveChatMessageInput,
  AppendSupportTicketMessageInput,
  SupportAgentIdentity,
  SupportAdminFlowCallbacks,
  SupportAdminFlowValidationConfig,
  SupportButtonCustomizer,
  SupportConfirmationButtonOverrides,
  SupportFlowAdapter,
  SupportFlowBase,
  SupportLiveChatQueueFilter,
  SupportLiveChatSession,
  SupportQueueFilter,
  SupportRequestInputButtonOverrides,
  SupportTicket,
  SupportTicketPriority,
  SupportTicketStatus,
  UpdateSupportLiveChatInput,
  UpdateSupportTicketInput,
} from './supportFlowTypes';
import {
  resolveConfirmationButtonOverrides,
  createRequestInputValidator,
  deriveAgentLabel,
  escapeMarkdown,
  formatLiveChatStatusLabel,
  formatTicketFullActivity,
  formatTicketRecentActivity,
  formatTicketStatusLabel,
  formatTimestamp,
  joinMarkdownLines,
  normalizeReference,
  resolveRequestInputButtonOverrides,
  resolveValidationSettings,
  validateSupportInput,
} from './supportFlowUtils';

export interface SupportAdminFlowLabels {
  readonly viewTicketQueue: string;
  readonly viewLiveChatQueue: string;
  readonly reviewTicket: string;
  readonly myAssignedWork: string;
  readonly backToAdminOptions: string;
  readonly backToLiveChatQueue: string;
  readonly refreshTicketQueue: string;
  readonly refreshLiveChats: string;
  readonly refreshChat: string;
  readonly endLiveChat: string;
  readonly joinLiveChat: string;
  readonly leaveLiveChat: string;
  readonly assignToMe: string;
  readonly assignedToMe: string;
  readonly assignToAgent: string;
  readonly setPriority: string;
  readonly setPriorityPrompt: (ticket: SupportTicket) => string;
  readonly setPriorityPlaceholder: string;
  readonly setPriorityDescription: string;
  readonly viewFullActivity: string;
  readonly replyToCustomer: string;
  readonly reopenTicket: string;
  readonly resolveTicket: string;
  readonly resolveConfirm: string;
  readonly resolveReject: string;
  readonly liveChatReplyPlaceholder: string;
  readonly liveChatReplyDescription: (
    session: SupportLiveChatSession
  ) => string;
}

export interface SupportAdminTicketInputContext {
  readonly agent: SupportAgentIdentity;
  readonly agentLabel: string;
  readonly ticket: SupportTicket;
}

export interface SupportAdminReviewTicketInputContext {
  readonly agent: SupportAgentIdentity;
  readonly agentLabel: string;
}

export interface SupportAdminFlowRequestInputs {
  readonly reviewTicket?:
    | SupportRequestInputButtonOverrides<SupportAdminReviewTicketInputContext>
    | undefined;
  readonly assignTicket?:
    | SupportRequestInputButtonOverrides<SupportAdminTicketInputContext>
    | undefined;
  readonly replyToCustomer?:
    | SupportRequestInputButtonOverrides<SupportAdminTicketInputContext>
    | undefined;
  readonly setPriority?:
    | SupportRequestInputButtonOverrides<SupportAdminTicketInputContext>
    | undefined;
}

export interface SupportAdminFlowConfirmations {
  readonly resolveTicket?:
    | SupportConfirmationButtonOverrides<SupportAdminTicketInputContext>
    | undefined;
}

export interface SupportAdminFormatterContext {
  readonly agent: SupportAgentIdentity;
  readonly agentLabel: string;
  readonly brandName: string;
  readonly queueLimit: number;
  readonly liveChatQueueLimit: number;
  readonly assignedWorkLimit: number;
  readonly recentActivityLimit: number;
  readonly transcriptLimit: number;
}

export interface SupportAdminTicketFormatterContext extends SupportAdminFormatterContext {
  readonly ticket: SupportTicket;
}

export interface SupportAdminTicketsFormatterContext extends SupportAdminFormatterContext {
  readonly tickets: readonly SupportTicket[];
}

export interface SupportAdminLiveChatFormatterContext extends SupportAdminFormatterContext {
  readonly session: SupportLiveChatSession;
}

export interface SupportAdminLiveChatsFormatterContext extends SupportAdminFormatterContext {
  readonly sessions: readonly SupportLiveChatSession[];
}

export interface SupportAdminFlowFormatters {
  readonly openingMessage?:
    | ((context: SupportAdminFormatterContext) => string)
    | undefined;
  readonly ticketDetails?:
    | ((context: SupportAdminTicketFormatterContext) => string)
    | undefined;
  readonly ticketFullActivity?:
    | ((context: SupportAdminTicketFormatterContext) => string)
    | undefined;
  readonly ticketQueue?:
    | ((context: SupportAdminTicketsFormatterContext) => string)
    | undefined;
  readonly liveChatQueue?:
    | ((context: SupportAdminLiveChatsFormatterContext) => string)
    | undefined;
  readonly liveChatDetails?:
    | ((context: SupportAdminLiveChatFormatterContext) => string)
    | undefined;
  readonly liveChatEnded?:
    | ((context: SupportAdminLiveChatFormatterContext) => string)
    | undefined;
  readonly liveChatJoined?:
    | ((context: SupportAdminLiveChatFormatterContext) => string)
    | undefined;
  readonly liveChatLeft?:
    | ((context: SupportAdminLiveChatFormatterContext) => string)
    | undefined;
  readonly ticketAssigned?:
    | ((context: SupportAdminTicketFormatterContext) => string)
    | undefined;
  readonly ticketPriorityChanged?:
    | ((context: SupportAdminTicketFormatterContext) => string)
    | undefined;
  readonly ticketReplySent?:
    | ((
        context: SupportAdminTicketFormatterContext & {
          readonly body: string;
        }
      ) => string)
    | undefined;
  readonly ticketReopened?:
    | ((context: SupportAdminTicketFormatterContext) => string)
    | undefined;
  readonly ticketResolved?:
    | ((context: SupportAdminTicketFormatterContext) => string)
    | undefined;
}

export interface SupportAdminStatusTransitions {
  readonly assignedTicketStatus?: SupportTicketStatus | undefined;
  readonly repliedTicketStatus?: SupportTicketStatus | undefined;
  readonly reopenedTicketStatus?: SupportTicketStatus | undefined;
  readonly resolvedTicketStatus?: SupportTicketStatus | undefined;
}

export interface SupportAdminFlowBehavior {
  readonly queueLimit?: number | undefined;
  readonly liveChatQueueLimit?: number | undefined;
  readonly assignedWorkLimit?: number | undefined;
  readonly recentActivityLimit?: number | undefined;
  readonly transcriptLimit?: number | undefined;
  readonly priorityOrder?: readonly SupportTicketPriority[] | undefined;
  readonly statusTransitions?: SupportAdminStatusTransitions | undefined;
  readonly isTicketResolved?: ((ticket: SupportTicket) => boolean) | undefined;
  readonly getTicketQueueButtonVariant?:
    | ((ticket: SupportTicket) => MessageButton['variant'])
    | undefined;
  readonly getLiveChatQueueButtonVariant?:
    | ((session: SupportLiveChatSession) => MessageButton['variant'])
    | undefined;
  readonly getAssignedWorkFilter?:
    | ((context: {
        readonly agent: SupportAgentIdentity;
        readonly agentLabel: string;
      }) => SupportQueueFilter)
    | undefined;
  readonly getRequeuedLiveChatPosition?:
    | ((context: {
        readonly session: SupportLiveChatSession;
        readonly queuedSessions: readonly SupportLiveChatSession[];
      }) => number)
    | undefined;
  readonly getRequeuedLiveChatEstimatedWaitMinutes?:
    | ((context: {
        readonly session: SupportLiveChatSession;
        readonly queuedSessions: readonly SupportLiveChatSession[];
        readonly queuePosition: number;
      }) => number)
    | undefined;
}

export type SupportAdminFlowButtonSlot =
  | 'primary'
  | 'ticket'
  | 'ticket-queue'
  | 'assigned-work'
  | 'live-chat'
  | 'live-chat-queue'
  | 'live-chat-persistent';

export interface SupportAdminFlowButtonContext {
  readonly slot: SupportAdminFlowButtonSlot;
  readonly defaultButtons: readonly MessageButton[];
  readonly agent: SupportAgentIdentity;
  readonly agentLabel: string;
  readonly tickets?: readonly SupportTicket[] | undefined;
  readonly ticket?: SupportTicket | undefined;
  readonly sessions?: readonly SupportLiveChatSession[] | undefined;
  readonly session?: SupportLiveChatSession | undefined;
}

export type SupportAdminFlowButtonCustomizer =
  SupportButtonCustomizer<SupportAdminFlowButtonContext>;

export interface SupportAdminFlowConfig {
  readonly adapter?: SupportFlowAdapter | undefined;
  readonly callbacks?: SupportAdminFlowCallbacks | undefined;
  readonly agent: SupportAgentIdentity;
  readonly brandName?: string | undefined;
  readonly initialMessage?: string | undefined;
  readonly validation?: SupportAdminFlowValidationConfig | undefined;
  readonly labels?: Partial<SupportAdminFlowLabels> | undefined;
  readonly requestInputs?: SupportAdminFlowRequestInputs | undefined;
  readonly confirmations?: SupportAdminFlowConfirmations | undefined;
  readonly formatters?: SupportAdminFlowFormatters | undefined;
  readonly behavior?: SupportAdminFlowBehavior | undefined;
  readonly customizeButtons?: SupportAdminFlowButtonCustomizer | undefined;
  readonly liveChatPersistentButtons?:
    | SupportAdminLiveChatPersistentButtonFactory
    | undefined;
}

export type SupportAdminFlow = SupportFlowBase;

export interface SupportAdminLiveChatPersistentButtonContext {
  readonly session: SupportLiveChatSession;
  readonly agent: SupportAgentIdentity;
  readonly endLiveChat: () => void;
  readonly refresh: () => void;
}

export type SupportAdminLiveChatPersistentButtonFactory = (
  context: SupportAdminLiveChatPersistentButtonContext
) => readonly MessageButton[];

const DEFAULT_PRIORITY_ORDER = ['low', 'normal', 'high', 'urgent'] as const;

const DEFAULT_ADMIN_LABELS: SupportAdminFlowLabels = {
  viewTicketQueue: 'View ticket queue',
  viewLiveChatQueue: 'View live chat queue',
  reviewTicket: 'Review a ticket',
  myAssignedWork: 'My assigned work',
  backToAdminOptions: 'Back to admin options',
  backToLiveChatQueue: 'Back to live chat queue',
  refreshTicketQueue: 'Refresh ticket queue',
  refreshLiveChats: 'Refresh live chats',
  refreshChat: 'Refresh chat',
  endLiveChat: 'End live chat',
  joinLiveChat: 'Join live chat',
  leaveLiveChat: 'Leave live chat',
  assignToMe: 'Assign to me',
  assignedToMe: 'Unassign from me',
  assignToAgent: 'Assign to agent',
  setPriority: 'Set priority',
  setPriorityPrompt: ticket => `Choose a priority for ${ticket.reference}.`,
  setPriorityPlaceholder: 'Select priority',
  setPriorityDescription: 'Choose the urgency level for this ticket.',
  viewFullActivity: 'View full activity',
  replyToCustomer: 'Reply to customer',
  reopenTicket: 'Re-open ticket',
  resolveTicket: 'Resolve ticket',
  resolveConfirm: 'Resolve',
  resolveReject: 'Keep open',
  liveChatReplyPlaceholder: 'Type a live chat reply...',
  liveChatReplyDescription: session => `Live chat ${session.id} is active.`,
};

function formatLiveChatMessageAuthor(
  message: NonNullable<SupportLiveChatSession['messages']>[number]
): string {
  if (message.author === 'customer') {
    return message.authorLabel ?? 'Customer';
  }

  if (message.author === 'agent') {
    return message.authorLabel ?? 'Support agent';
  }

  return message.authorLabel ?? 'System';
}

function getLiveChatEndButtonId(sessionId: string): string {
  return `support-admin-live-chat-end-${sessionId}`;
}

function getTicketQueueButtonVariant(
  ticket: SupportTicket
): MessageButton['variant'] {
  return ticket.assignedTo ? 'error' : 'success';
}

function getLiveChatQueueButtonVariant(
  session: SupportLiveChatSession
): MessageButton['variant'] {
  return session.status === 'active' && session.agent ? 'error' : 'success';
}

function formatQueueSummary(
  tickets: readonly SupportTicket[],
  queueLimit: number
): string {
  return joinMarkdownLines([
    '## Ticket queue',
    '',
    ...tickets.slice(0, queueLimit).map(ticket => {
      const assignedText = ticket.assignedTo
        ? `assigned to ${escapeMarkdown(ticket.assignedTo)}`
        : 'unassigned';
      return `- **${escapeMarkdown(ticket.reference)} (${escapeMarkdown(ticket.priority)}):** ${escapeMarkdown(ticket.subject)} (${escapeMarkdown(formatTicketStatusLabel(ticket.status))}, ${assignedText})`;
    }),
  ]);
}

function formatLiveChatQueueSummary(
  sessions: readonly SupportLiveChatSession[],
  liveChatQueueLimit: number
): string {
  return joinMarkdownLines([
    '## Live chat queue',
    '',
    ...sessions.slice(0, liveChatQueueLimit).map(session => {
      const customerText =
        session.customer?.name ?? session.customer?.email ?? 'Unknown customer';
      const ticketText = session.ticketReference
        ? `linked to ${escapeMarkdown(session.ticketReference)}`
        : 'not linked to a ticket';

      return `- **${escapeMarkdown(session.id)}:** ${escapeMarkdown(formatLiveChatStatusLabel(session.status))}, position ${session.queuePosition}, ${session.estimatedWaitMinutes} min wait, ${ticketText}, ${escapeMarkdown(customerText)}`;
    }),
  ]);
}

function formatLiveChatDetails(
  session: SupportLiveChatSession,
  transcriptLimit: number
): string {
  const messages = session.messages ?? [];

  return joinMarkdownLines([
    `## Live chat ${escapeMarkdown(session.id)}`,
    '',
    `- **Status:** ${escapeMarkdown(formatLiveChatStatusLabel(session.status))}`,
    `- **Requested by:** ${escapeMarkdown(session.requestedBy)}`,
    `- **Queue position:** ${session.queuePosition}`,
    `- **Estimated wait:** ${session.estimatedWaitMinutes} minutes`,
    session.ticketReference
      ? `- **Linked ticket:** ${escapeMarkdown(session.ticketReference)}`
      : '- **Linked ticket:** None',
    session.customer
      ? `- **Customer:** ${escapeMarkdown(session.customer.name ?? session.customer.email ?? 'Unknown customer')}`
      : '- **Customer:** Unknown customer',
    session.agent
      ? `- **Agent:** ${escapeMarkdown(session.agent.name ?? session.agent.email ?? 'Unknown agent')}`
      : undefined,
    `- **Requested:** ${escapeMarkdown(formatTimestamp(session.createdAt))}`,
    '',
    '### Handoff summary',
    '',
    escapeMarkdown(session.summary),
    '',
    messages.length ? '### Chat transcript' : undefined,
    '',
    ...messages.slice(-transcriptLimit).map(message => {
      return `- **${escapeMarkdown(formatLiveChatMessageAuthor(message))}** (${escapeMarkdown(formatTimestamp(message.createdAt))}): ${escapeMarkdown(message.body)}`;
    }),
    messages.length > transcriptLimit
      ? `_Showing the ${transcriptLimit} most recent messages._`
      : undefined,
  ]);
}

function formatTicketDetails(
  ticket: SupportTicket,
  recentActivityLimit: number
): string {
  const latestMessage = ticket.messages[ticket.messages.length - 1];
  return joinMarkdownLines([
    `## Ticket ${escapeMarkdown(ticket.reference)}`,
    '',
    `- **Status:** ${escapeMarkdown(formatTicketStatusLabel(ticket.status))}`,
    `- **Priority:** ${escapeMarkdown(ticket.priority)}`,
    `- **Customer:** ${escapeMarkdown(ticket.customer.name ?? ticket.customer.email ?? 'Unknown customer')}`,
    `- **Subject:** ${escapeMarkdown(ticket.subject)}`,
    ticket.assignedTo
      ? `- **Assigned to:** ${escapeMarkdown(ticket.assignedTo)}`
      : '- **Assigned to:** No agent assigned yet',
    `- **Updated:** ${escapeMarkdown(formatTimestamp(ticket.updatedAt))}`,
    latestMessage
      ? `- **Latest message:** ${escapeMarkdown(latestMessage.authorLabel ?? latestMessage.author)} said "${escapeMarkdown(latestMessage.body)}"`
      : undefined,
    '',
    formatTicketRecentActivity(ticket, recentActivityLimit),
  ]);
}

function withPersistentButtonIds(
  buttons: readonly MessageButton[],
  idPrefix: string
): readonly (MessageButton & { readonly id: string })[] {
  return buttons.map((button, index) => {
    const explicitId = (button as MessageButton & { readonly id?: string }).id;
    return {
      ...button,
      id: explicitId ?? `${idPrefix}-${index}`,
    };
  });
}

export function createSupportAdminFlow(
  config: SupportAdminFlowConfig
): SupportAdminFlow {
  const {
    adapter,
    callbacks = {},
    agent,
    brandName = 'Support operations',
  } = config;
  const liveChatPersistentButtonIds = new Map<string, readonly string[]>();
  const agentLabel = deriveAgentLabel(agent);
  const labels = {
    ...DEFAULT_ADMIN_LABELS,
    ...config.labels,
  };
  const behavior = config.behavior ?? {};
  const queueLimit = behavior.queueLimit ?? 5;
  const liveChatQueueLimit = behavior.liveChatQueueLimit ?? 5;
  const assignedWorkLimit = behavior.assignedWorkLimit ?? 5;
  const recentActivityLimit = behavior.recentActivityLimit ?? 4;
  const transcriptLimit = behavior.transcriptLimit ?? 8;
  const priorityOrder = behavior.priorityOrder ?? DEFAULT_PRIORITY_ORDER;
  const statusTransitions = behavior.statusTransitions ?? {};
  const formatterContext: SupportAdminFormatterContext = {
    agent,
    agentLabel,
    brandName,
    queueLimit,
    liveChatQueueLimit,
    assignedWorkLimit,
    recentActivityLimit,
    transcriptLimit,
  };
  const defaultOpeningMessage = joinMarkdownLines([
    `## ${escapeMarkdown(brandName)} is ready`,
    '',
    'You can work the queue from here:',
    '',
    '- Review the ticket queue',
    '- Review the live chat queue',
    '- Join and reply to active live chats',
  ]);
  const openingMessage =
    config.initialMessage ??
    config.formatters?.openingMessage?.(formatterContext) ??
    defaultOpeningMessage;
  const validation = config.validation ?? {};
  const ticketAssignmentValidation = resolveValidationSettings(
    {
      minMessageLength: 1,
      minMessageLengthMessage: 'Enter an agent name or email.',
    },
    validation.ticketAssignment
  );
  const ticketReplyValidation = resolveValidationSettings(
    {
      minMessageLength: 8,
    },
    validation.ticketReply
  );
  const liveChatMessageValidation = resolveValidationSettings(
    {
      minMessageLength: 1,
    },
    validation.liveChatMessage
  );

  const canListTicketQueue = Boolean(
    callbacks.listTicketQueue ?? adapter?.listQueue
  );
  const canListLiveChatQueue = Boolean(
    callbacks.listLiveChatQueue ?? adapter?.listLiveChatQueue
  );
  const canGetTicket = Boolean(
    callbacks.getTicket ?? adapter?.getTicketByReference
  );
  const canUpdateTicket = Boolean(
    callbacks.updateTicket ?? adapter?.updateTicket
  );
  const canAppendTicketMessage = Boolean(
    callbacks.appendTicketMessage ?? adapter?.appendTicketMessage
  );
  const canGetLiveChat = Boolean(
    callbacks.getLiveChat ?? adapter?.getLiveChatById
  );
  const canUpdateLiveChat = Boolean(
    callbacks.updateLiveChat ?? adapter?.updateLiveChat
  );
  const canAppendLiveChatMessage = Boolean(
    callbacks.appendLiveChatMessage ?? adapter?.appendLiveChatMessage
  );
  const canOpenLiveChatQueue = canListLiveChatQueue && canGetLiveChat;

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

  const formatAdminTicketDetails = (ticket: SupportTicket): string => {
    const context: SupportAdminTicketFormatterContext = {
      ...formatterContext,
      ticket,
    };

    return (
      config.formatters?.ticketDetails?.(context) ??
      formatTicketDetails(ticket, recentActivityLimit)
    );
  };

  const formatAdminTicketFullActivity = (ticket: SupportTicket): string => {
    const context: SupportAdminTicketFormatterContext = {
      ...formatterContext,
      ticket,
    };

    return (
      config.formatters?.ticketFullActivity?.(context) ??
      formatTicketFullActivity(ticket)
    );
  };

  const formatAdminTicketQueue = (
    tickets: readonly SupportTicket[]
  ): string => {
    return (
      config.formatters?.ticketQueue?.({
        ...formatterContext,
        tickets,
      }) ?? formatQueueSummary(tickets, queueLimit)
    );
  };

  const formatAdminLiveChatQueue = (
    sessions: readonly SupportLiveChatSession[]
  ): string => {
    return (
      config.formatters?.liveChatQueue?.({
        ...formatterContext,
        sessions,
      }) ?? formatLiveChatQueueSummary(sessions, liveChatQueueLimit)
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
  const listTicketQueue = async (
    filter?: SupportQueueFilter
  ): Promise<readonly SupportTicket[]> => {
    if (callbacks.listTicketQueue) {
      return callbacks.listTicketQueue(filter);
    }

    if (adapter?.listQueue) {
      return adapter.listQueue(filter);
    }

    return [];
  };

  const listLiveChatQueue = async (
    filter?: SupportLiveChatQueueFilter
  ): Promise<readonly SupportLiveChatSession[]> => {
    if (callbacks.listLiveChatQueue) {
      return callbacks.listLiveChatQueue(filter);
    }

    if (adapter?.listLiveChatQueue) {
      return adapter.listLiveChatQueue(filter);
    }

    return [];
  };

  const getTicket = async (
    reference: string
  ): Promise<SupportTicket | null> => {
    if (callbacks.getTicket) {
      return callbacks.getTicket(reference);
    }

    if (adapter?.getTicketByReference) {
      return adapter.getTicketByReference(reference);
    }

    return null;
  };

  const updateTicket = async (
    input: UpdateSupportTicketInput
  ): Promise<SupportTicket> => {
    if (callbacks.updateTicket) {
      return callbacks.updateTicket(input);
    }

    if (adapter?.updateTicket) {
      return adapter.updateTicket(input);
    }

    throw new Error('No support ticket update callback was provided.');
  };

  const appendTicketMessage = async (
    input: AppendSupportTicketMessageInput
  ): Promise<SupportTicket> => {
    if (callbacks.appendTicketMessage) {
      return callbacks.appendTicketMessage(input);
    }

    if (adapter?.appendTicketMessage) {
      return adapter.appendTicketMessage(input);
    }

    throw new Error('No support ticket message callback was provided.');
  };

  const getLiveChat = async (
    sessionId: string
  ): Promise<SupportLiveChatSession | null> => {
    if (callbacks.getLiveChat) {
      return callbacks.getLiveChat(sessionId);
    }

    if (adapter?.getLiveChatById) {
      return adapter.getLiveChatById(sessionId);
    }

    return null;
  };

  const updateLiveChat = async (
    input: UpdateSupportLiveChatInput
  ): Promise<SupportLiveChatSession> => {
    if (callbacks.updateLiveChat) {
      return callbacks.updateLiveChat(input);
    }

    if (adapter?.updateLiveChat) {
      return adapter.updateLiveChat(input);
    }

    throw new Error('No live chat update callback was provided.');
  };

  const appendLiveChatMessage = async (
    input: AppendSupportLiveChatMessageInput
  ): Promise<SupportLiveChatSession> => {
    if (callbacks.appendLiveChatMessage) {
      return callbacks.appendLiveChatMessage(input);
    }

    if (adapter?.appendLiveChatMessage) {
      return adapter.appendLiveChatMessage(input);
    }

    throw new Error('No live chat message callback was provided.');
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

  const configureLiveChatInput = (session: SupportLiveChatSession): void => {
    useInputFieldStore.getState().setInputFieldParams({
      disabled: session.status === 'ended',
      placeholder: labels.liveChatReplyPlaceholder,
      description: labels.liveChatReplyDescription(session),
      submitGuard: (value, submission) => {
        return (
          validateSupportInput(value, liveChatMessageValidation, submission) ===
          true
        );
      },
    });
  };

  const resetLiveChatInput = (): void => {
    useInputFieldStore.getState().resetInputFieldParams({
      value: true,
      placeholder: true,
      description: true,
      disabledPlaceholder: true,
      submitGuard: true,
      disabled: true,
    });
  };

  const removeLiveChatPersistentButtons = (sessionId: string): void => {
    const ids = liveChatPersistentButtonIds.get(sessionId) ?? [];
    ids.forEach(id => {
      usePersistentButtonStore.getState().removeButton(id);
    });
    liveChatPersistentButtonIds.delete(sessionId);
  };

  const removeAllLiveChatPersistentButtons = (): void => {
    [...liveChatPersistentButtonIds.keys()].forEach(
      removeLiveChatPersistentButtons
    );
  };

  const showInitialOptions = (): void => {
    removeAllLiveChatPersistentButtons();
    resetLiveChatInput();
    addSupportMessage(openingMessage, createPrimaryButtons());
  };

  const createBackToAdminOptionsButton = (): MessageButton => {
    return createButton({
      label: labels.backToAdminOptions,
      onClick: showInitialOptions,
    });
  };

  const endLiveChat = async (
    session: SupportLiveChatSession
  ): Promise<void> => {
    const updatedSession = await updateLiveChat({
      sessionId: session.id,
      status: 'ended',
      queuePosition: 0,
      estimatedWaitMinutes: 0,
      agent,
    });

    removeLiveChatPersistentButtons(session.id);
    resetLiveChatInput();

    addSupportMessage(
      config.formatters?.liveChatEnded?.({
        ...formatterContext,
        session: updatedSession,
      }) ??
        joinMarkdownLines([
          `## Ended live chat ${escapeMarkdown(updatedSession.id)}`,
          '',
          `- **Status:** ${escapeMarkdown(formatLiveChatStatusLabel(updatedSession.status))}`,
        ]),
      createLiveChatButtons(updatedSession)
    );
  };

  const createRefreshLiveChatButton = (sessionId: string): MessageButton => {
    return createButton({
      label: labels.refreshChat,
      onClick: () => {
        void showLiveChat(sessionId);
      },
    });
  };

  const addLiveChatPersistentButtons = (
    session: SupportLiveChatSession
  ): void => {
    if (session.status === 'ended') {
      removeLiveChatPersistentButtons(session.id);
      return;
    }

    removeLiveChatPersistentButtons(session.id);

    const context: SupportAdminLiveChatPersistentButtonContext = {
      session,
      agent,
      endLiveChat: () => {
        void endLiveChat(session);
      },
      refresh: () => {
        void showLiveChat(session.id);
      },
    };
    const injectedButtons = config.liveChatPersistentButtons?.(context) ?? [];
    const defaultButtons = [
      {
        id: getLiveChatEndButtonId(session.id),
        label: labels.endLiveChat,
        variant: 'error' as const,
        onClick: () => {
          void endLiveChat(session);
        },
      },
      ...injectedButtons,
    ];
    const buttons = withPersistentButtonIds(
      customizeButtons({
        slot: 'live-chat-persistent',
        defaultButtons,
        session,
      }),
      `support-live-chat-agent-custom-${session.id}`
    );

    buttons.forEach(button => {
      usePersistentButtonStore.getState().addButton(button);
    });
    liveChatPersistentButtonIds.set(
      session.id,
      buttons.map(button => button.id)
    );
  };

  const createLiveChatResponseCallback = (
    session: SupportLiveChatSession
  ): ((submission?: InputSubmission) => void) => {
    return submission => {
      const body = submission?.text.trim() ?? '';
      if (!body) {
        renderLiveChatSession(session);
        return;
      }

      void (async () => {
        const latestSession = await getLiveChat(session.id);
        if (!latestSession || latestSession.status === 'ended') {
          resetLiveChatInput();
          removeLiveChatPersistentButtons(session.id);
          addSupportMessage(
            `Live chat ${session.id} has ended or could not be found.`,
            createPrimaryButtons()
          );
          return;
        }

        const updatedSession = await appendLiveChatMessage({
          sessionId: session.id,
          author: 'agent',
          authorLabel: agentLabel,
          body,
        });

        renderLiveChatSession(updatedSession);
      })();
    };
  };

  const addLiveChatInputMessage = (session: SupportLiveChatSession): void => {
    addLiveChatPersistentButtons(session);
    configureLiveChatInput(session);
    addSupportMessage(
      formatAdminLiveChatDetails(session),
      createLiveChatButtons(session),
      createLiveChatResponseCallback(session)
    );
  };

  const renderLiveChatSession = (session: SupportLiveChatSession): void => {
    if (session.status === 'ended') {
      removeLiveChatPersistentButtons(session.id);
      resetLiveChatInput();
      addSupportMessage(
        formatAdminLiveChatDetails(session),
        createLiveChatButtons(session)
      );
      return;
    }

    if (
      session.status === 'active' &&
      session.agent &&
      canAppendLiveChatMessage
    ) {
      addLiveChatInputMessage(session);
      return;
    }

    removeLiveChatPersistentButtons(session.id);

    resetLiveChatInput();
    addSupportMessage(
      formatAdminLiveChatDetails(session),
      createLiveChatButtons(session)
    );
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

  const showTicketQueue = async (): Promise<void> => {
    const tickets = await listTicketQueue();

    if (!tickets.length) {
      addSupportMessage(
        'The ticket queue is empty right now.',
        createPrimaryButtons()
      );
      return;
    }

    const visibleTickets = tickets.slice(0, queueLimit);
    const defaultButtons = [
      ...visibleTickets.map(ticket => {
        return createButton({
          label: ticket.reference,
          variant:
            behavior.getTicketQueueButtonVariant?.(ticket) ??
            getTicketQueueButtonVariant(ticket),
          onClick: () => {
            void showTicket(ticket.reference);
          },
        });
      }),
      createButton({
        label: labels.refreshTicketQueue,
        onClick: () => {
          void showTicketQueue();
        },
      }),
      createBackToAdminOptionsButton(),
    ];

    addSupportMessage(
      formatAdminTicketQueue(tickets),
      customizeButtons({
        slot: 'ticket-queue',
        defaultButtons,
        tickets,
      })
    );
  };

  const showLiveChat = async (sessionId: string): Promise<void> => {
    const session = await getLiveChat(sessionId);

    if (!session) {
      addSupportMessage(
        `Live chat ${sessionId} was not found in the live chat queue.`,
        createPrimaryButtons()
      );
      return;
    }

    renderLiveChatSession(session);
  };

  const showLiveChatQueue = async (): Promise<void> => {
    const sessions = await listLiveChatQueue();

    if (!sessions.length) {
      addSupportMessage(
        'The live chat queue is empty right now.',
        createPrimaryButtons()
      );
      return;
    }

    const visibleSessions = sessions.slice(0, liveChatQueueLimit);
    const defaultButtons = [
      ...visibleSessions.map(session => {
        return createButton({
          label: session.id,
          variant:
            behavior.getLiveChatQueueButtonVariant?.(session) ??
            getLiveChatQueueButtonVariant(session),
          onClick: () => {
            void showLiveChat(session.id);
          },
        });
      }),
      createButton({
        label: labels.refreshLiveChats,
        onClick: () => {
          void showLiveChatQueue();
        },
      }),
      createBackToAdminOptionsButton(),
    ];

    addSupportMessage(
      formatAdminLiveChatQueue(sessions),
      customizeButtons({
        slot: 'live-chat-queue',
        defaultButtons,
        sessions,
      })
    );
  };

  const createJoinLiveChatButton = (
    session: SupportLiveChatSession
  ): MessageButton => {
    const currentAgentJoined =
      session.status === 'active' &&
      session.agent &&
      deriveAgentLabel(session.agent) === agentLabel;

    return createButton({
      label: currentAgentJoined ? labels.leaveLiveChat : labels.joinLiveChat,
      onClick: () => {
        void (async () => {
          if (currentAgentJoined) {
            const queuedSessions = await listLiveChatQueue({
              statuses: ['queued'],
            });
            const queuePosition =
              behavior.getRequeuedLiveChatPosition?.({
                session,
                queuedSessions,
              }) ?? queuedSessions.length + 1;
            const updatedSession = await updateLiveChat({
              sessionId: session.id,
              status: 'queued',
              queuePosition,
              estimatedWaitMinutes:
                behavior.getRequeuedLiveChatEstimatedWaitMinutes?.({
                  session,
                  queuedSessions,
                  queuePosition,
                }) ?? 2 + queuedSessions.length * 3,
              agent: null,
            });

            removeLiveChatPersistentButtons(session.id);
            resetLiveChatInput();
            addSupportMessage(
              config.formatters?.liveChatLeft?.({
                ...formatterContext,
                session: updatedSession,
              }) ??
                joinMarkdownLines([
                  `## Left live chat ${escapeMarkdown(updatedSession.id)}`,
                  '',
                  `- **Status:** ${escapeMarkdown(formatLiveChatStatusLabel(updatedSession.status))}`,
                  `- **Queue position:** ${updatedSession.queuePosition}`,
                ]),
              []
            );
            renderLiveChatSession(updatedSession);
            return;
          }

          const updatedSession = await updateLiveChat({
            sessionId: session.id,
            status: 'active',
            queuePosition: 0,
            estimatedWaitMinutes: 0,
            agent,
          });

          addSupportMessage(
            config.formatters?.liveChatJoined?.({
              ...formatterContext,
              session: updatedSession,
            }) ??
              joinMarkdownLines([
                `## Joined live chat ${escapeMarkdown(updatedSession.id)}`,
                '',
                `- **Status:** ${escapeMarkdown(formatLiveChatStatusLabel(updatedSession.status))}`,
                `- **Agent:** ${escapeMarkdown(agentLabel)}`,
              ]),
            []
          );
          renderLiveChatSession(updatedSession);
        })();
      },
    });
  };

  const createLiveChatButtons = (
    session: SupportLiveChatSession
  ): readonly MessageButton[] => {
    const ticketReference = session.ticketReference;

    const defaultButtons = [
      ...(session.status !== 'ended' && canUpdateLiveChat
        ? [createJoinLiveChatButton(session)]
        : []),
      createRefreshLiveChatButton(session.id),
      ...(ticketReference && canGetTicket
        ? [
            createButton({
              label: ticketReference,
              onClick: () => {
                void showTicket(ticketReference);
              },
            }),
          ]
        : []),
      ...(canOpenLiveChatQueue
        ? [
            createButton({
              label: labels.backToLiveChatQueue,
              onClick: () => {
                void showLiveChatQueue();
              },
            }),
          ]
        : []),
      createBackToAdminOptionsButton(),
    ];

    return customizeButtons({
      slot: 'live-chat',
      defaultButtons,
      session,
    });
  };

  const createAssignButton = (ticket: SupportTicket): MessageButton => {
    const isAssignedToCurrentAgent = ticket.assignedTo === agentLabel;

    return createButton({
      label: isAssignedToCurrentAgent ? labels.assignedToMe : labels.assignToMe,
      onClick: () => {
        void (async () => {
          const updatedTicket = await updateTicket({
            reference: ticket.reference,
            assignedTo: isAssignedToCurrentAgent ? null : agentLabel,
            status:
              ticket.status === 'new'
                ? (statusTransitions.assignedTicketStatus ?? 'open')
                : ticket.status,
          });

          addSupportMessage(
            config.formatters?.ticketAssigned?.({
              ...formatterContext,
              ticket: updatedTicket,
            }) ??
              (isAssignedToCurrentAgent
                ? joinMarkdownLines([
                    `## ${escapeMarkdown(updatedTicket.reference)} is now unassigned`,
                    '',
                    `- **Status:** ${escapeMarkdown(formatTicketStatusLabel(updatedTicket.status))}`,
                    `- **Priority:** ${escapeMarkdown(updatedTicket.priority)}`,
                  ])
                : joinMarkdownLines([
                    `## ${escapeMarkdown(updatedTicket.reference)} is now assigned to ${escapeMarkdown(agentLabel)}`,
                    '',
                    `- **Status:** ${escapeMarkdown(formatTicketStatusLabel(updatedTicket.status))}`,
                    `- **Priority:** ${escapeMarkdown(updatedTicket.priority)}`,
                  ])),
            createTicketButtons(updatedTicket)
          );
        })();
      },
    });
  };

  const createAssignToAgentButton = (ticket: SupportTicket): MessageButton => {
    const assignmentValidator = createRequestInputValidator(
      ticketAssignmentValidation
    );
    const inputContext: SupportAdminTicketInputContext = {
      agent,
      agentLabel,
      ticket,
    };

    return createButton(
      createRequestInputButtonDef({
        initialLabel: labels.assignToAgent,
        inputPromptMessage: `Assign ${ticket.reference} to an agent.`,
        placeholder: 'Avery Specialist or avery@example.com',
        inputDescription: 'Enter the assignee name or email.',
        minMessageLength: ticketAssignmentValidation.minMessageLength,
        minMessageLengthMessage:
          ticketAssignmentValidation.minMessageLengthMessage,
        validator: (value, submission) => {
          const assignmentResult =
            assignmentValidator?.(value, submission) ?? true;

          if (assignmentResult !== true) {
            return assignmentResult;
          }

          return value.trim() ? true : 'Enter an agent name or email.';
        },
        ...resolveRequestInputButtonOverrides(
          config.requestInputs?.assignTicket,
          inputContext
        ),
        onSuccess: async assigneeInput => {
          const assignee = assigneeInput.trim();
          const updatedTicket = await updateTicket({
            reference: ticket.reference,
            assignedTo: assignee,
            status:
              ticket.status === 'new'
                ? (statusTransitions.assignedTicketStatus ?? 'open')
                : ticket.status,
          });

          addSupportMessage(
            config.formatters?.ticketAssigned?.({
              ...formatterContext,
              ticket: updatedTicket,
            }) ??
              joinMarkdownLines([
                `## ${escapeMarkdown(updatedTicket.reference)} is now assigned to ${escapeMarkdown(assignee)}`,
                '',
                `- **Status:** ${escapeMarkdown(formatTicketStatusLabel(updatedTicket.status))}`,
                `- **Priority:** ${escapeMarkdown(updatedTicket.priority)}`,
              ]),
            createTicketButtons(updatedTicket)
          );
        },
      }),
      {
        abortCallback: () => {
          addAbortRecoveryMessage(
            `Assignment cancelled for ${ticket.reference}. You can keep reviewing the ticket or return to admin options.`,
            createTicketButtons(ticket)
          );
        },
      }
    );
  };

  const updateTicketPriority = async (
    ticket: SupportTicket,
    priority: SupportTicketPriority
  ): Promise<void> => {
    const updatedTicket = await updateTicket({
      reference: ticket.reference,
      priority,
    });

    addSupportMessage(
      config.formatters?.ticketPriorityChanged?.({
        ...formatterContext,
        ticket: updatedTicket,
      }) ??
        joinMarkdownLines([
          `## ${escapeMarkdown(updatedTicket.reference)} is now ${escapeMarkdown(updatedTicket.priority)} priority`,
          '',
          `- **Assigned to:** ${escapeMarkdown(updatedTicket.assignedTo ?? 'No agent assigned yet')}`,
          `- **Status:** ${escapeMarkdown(formatTicketStatusLabel(updatedTicket.status))}`,
        ]),
      createTicketButtons(updatedTicket)
    );
  };

  const createSetPriorityButton = (ticket: SupportTicket): MessageButton => {
    const inputContext: SupportAdminTicketInputContext = {
      agent,
      agentLabel,
      ticket,
    };

    return createButton(
      createRequestInputButtonDef({
        initialLabel: labels.setPriority,
        inputPromptMessage: labels.setPriorityPrompt(ticket),
        placeholder: labels.setPriorityPlaceholder,
        inputDescription: labels.setPriorityDescription,
        inputType: 'select',
        inputOptions: priorityOrder.map(priority => {
          return {
            value: priority,
            label: priority,
            disabled: priority === ticket.priority,
          };
        }),
        validator: value => {
          return priorityOrder.includes(value as SupportTicketPriority)
            ? true
            : 'Choose a valid priority.';
        },
        ...resolveRequestInputButtonOverrides(
          config.requestInputs?.setPriority,
          inputContext
        ),
        onSuccess: async priority => {
          await updateTicketPriority(ticket, priority as SupportTicketPriority);
        },
      }),
      {
        abortCallback: () => {
          addAbortRecoveryMessage(
            `Priority update cancelled for ${ticket.reference}. You can keep reviewing the ticket or return to admin options.`,
            createTicketButtons(ticket)
          );
        },
      }
    );
  };

  const createReplyButton = (ticket: SupportTicket): MessageButton => {
    const inputContext: SupportAdminTicketInputContext = {
      agent,
      agentLabel,
      ticket,
    };

    return createButton(
      createRequestInputButtonDef({
        initialLabel: labels.replyToCustomer,
        inputPromptMessage: `Send an update to the customer on ${ticket.reference}.`,
        placeholder: 'We reproduced the issue and are working on a fix.',
        inputDescription:
          'This adds a public-facing support response and moves the ticket to pending customer.',
        minMessageLength: ticketReplyValidation.minMessageLength,
        minMessageLengthMessage: ticketReplyValidation.minMessageLengthMessage,
        validator: createRequestInputValidator(ticketReplyValidation),
        ...resolveRequestInputButtonOverrides(
          config.requestInputs?.replyToCustomer,
          inputContext
        ),
        onSuccess: async body => {
          await appendTicketMessage({
            reference: ticket.reference,
            author: 'agent',
            authorLabel: agentLabel,
            body,
          });
          const updatedTicket = await updateTicket({
            reference: ticket.reference,
            status: statusTransitions.repliedTicketStatus ?? 'pending-customer',
            assignedTo: ticket.assignedTo ?? agentLabel,
          });

          addSupportMessage(
            config.formatters?.ticketReplySent?.({
              ...formatterContext,
              ticket: updatedTicket,
              body,
            }) ??
              joinMarkdownLines([
                `## Sent your reply on ${escapeMarkdown(updatedTicket.reference)}`,
                '',
                `- **Assigned to:** ${escapeMarkdown(updatedTicket.assignedTo ?? agentLabel)}`,
                `- **Next status:** ${escapeMarkdown(formatTicketStatusLabel(updatedTicket.status))}`,
                '',
                '### Reply sent',
                '',
                escapeMarkdown(body),
              ]),
            createTicketButtons(updatedTicket)
          );
        },
      }),
      {
        abortCallback: () => {
          addAbortRecoveryMessage(
            `Reply cancelled for ${ticket.reference}. You can update the customer later or keep triaging the ticket.`,
            createTicketButtons(ticket)
          );
        },
      }
    );
  };

  const createResolveButton = (ticket: SupportTicket): MessageButton => {
    const isResolved =
      behavior.isTicketResolved?.(ticket) ??
      (ticket.status === 'resolved' || ticket.status === 'closed');
    const inputContext: SupportAdminTicketInputContext = {
      agent,
      agentLabel,
      ticket,
    };

    if (isResolved) {
      return createButton({
        label: labels.reopenTicket,
        onClick: () => {
          void (async () => {
            const updatedTicket = await updateTicket({
              reference: ticket.reference,
              status: statusTransitions.reopenedTicketStatus ?? 'open',
              assignedTo: ticket.assignedTo ?? agentLabel,
            });

            addSupportMessage(
              config.formatters?.ticketReopened?.({
                ...formatterContext,
                ticket: updatedTicket,
              }) ??
                joinMarkdownLines([
                  `## ${escapeMarkdown(updatedTicket.reference)} is open again`,
                  '',
                  `- **Assigned to:** ${escapeMarkdown(updatedTicket.assignedTo ?? agentLabel)}`,
                  `- **Priority:** ${escapeMarkdown(updatedTicket.priority)}`,
                ]),
              createTicketButtons(updatedTicket)
            );
          })();
        },
      });
    }

    return createButton(
      createRequestConfirmationButtonDef({
        initialLabel: labels.resolveTicket,
        confirmationMessage: `Resolve ${ticket.reference} and mark the work complete?`,
        confirmLabel: labels.resolveConfirm,
        rejectLabel: labels.resolveReject,
        ...resolveConfirmationButtonOverrides(
          config.confirmations?.resolveTicket,
          inputContext
        ),
        onSuccess: () => {
          void (async () => {
            const updatedTicket = await updateTicket({
              reference: ticket.reference,
              status: statusTransitions.resolvedTicketStatus ?? 'resolved',
              assignedTo: ticket.assignedTo ?? agentLabel,
            });

            addSupportMessage(
              config.formatters?.ticketResolved?.({
                ...formatterContext,
                ticket: updatedTicket,
              }) ??
                joinMarkdownLines([
                  `## ${escapeMarkdown(updatedTicket.reference)} has been resolved`,
                  '',
                  `- **Assigned to:** ${escapeMarkdown(updatedTicket.assignedTo ?? agentLabel)}`,
                  `- **Priority:** ${escapeMarkdown(updatedTicket.priority)}`,
                ]),
              createTicketButtons(updatedTicket)
            );
          })();
        },
      })
    );
  };

  const createTicketButtons = (
    ticket: SupportTicket
  ): readonly MessageButton[] => {
    const defaultButtons = [
      ...(canUpdateTicket
        ? [
            createAssignButton(ticket),
            createAssignToAgentButton(ticket),
            createSetPriorityButton(ticket),
          ]
        : []),
      createButton({
        label: labels.viewFullActivity,
        onClick: () => {
          void showFullActivity(ticket.reference);
        },
      }),
      ...(canAppendTicketMessage && canUpdateTicket
        ? [createReplyButton(ticket)]
        : []),
      ...(canUpdateTicket ? [createResolveButton(ticket)] : []),
      createBackToAdminOptionsButton(),
    ];

    return customizeButtons({
      slot: 'ticket',
      defaultButtons,
      ticket,
    });
  };

  const createReviewTicketButton = (): MessageButton => {
    const inputContext: SupportAdminReviewTicketInputContext = {
      agent,
      agentLabel,
    };

    return createButton(
      createRequestInputButtonDef({
        initialLabel: labels.reviewTicket,
        inputPromptMessage:
          'Share the support ticket reference you want to review.',
        placeholder: 'SUP-1000',
        inputDescription:
          'Ticket references are usually formatted like SUP-1000.',
        validator: value => {
          return /^SUP-\d{4}$/i.test(value.trim())
            ? true
            : 'Use a ticket reference like SUP-1000.';
        },
        ...resolveRequestInputButtonOverrides(
          config.requestInputs?.reviewTicket,
          inputContext
        ),
        onSuccess: async reference => {
          await showTicket(reference);
        },
      }),
      {
        abortCallback: () => {
          addAbortRecoveryMessage(
            'Ticket review cancelled. You can inspect the queue, try another reference, or jump back into your assigned work.',
            createPrimaryButtons()
          );
        },
      }
    );
  };

  function createPrimaryButtons(): readonly MessageButton[] {
    const defaultButtons = [
      ...(canListTicketQueue
        ? [
            createButton({
              label: labels.viewTicketQueue,
              onClick: () => {
                void showTicketQueue();
              },
            }),
          ]
        : []),
      ...(canOpenLiveChatQueue
        ? [
            createButton({
              label: labels.viewLiveChatQueue,
              onClick: () => {
                void showLiveChatQueue();
              },
            }),
          ]
        : []),
      ...(canGetTicket ? [createReviewTicketButton()] : []),
      ...(canListTicketQueue
        ? [
            createButton({
              label: labels.myAssignedWork,
              onClick: () => {
                void (async () => {
                  const tickets = await listTicketQueue(
                    behavior.getAssignedWorkFilter?.({
                      agent,
                      agentLabel,
                    }) ?? {
                      assignedTo: agentLabel,
                    }
                  );

                  if (!tickets.length) {
                    addSupportMessage(
                      joinMarkdownLines([
                        `## ${escapeMarkdown(agentLabel)} does not have any assigned tickets right now`,
                        '',
                        'View the full queue to pick up the next request.',
                      ]),
                      createPrimaryButtons()
                    );
                    return;
                  }

                  const visibleTickets = tickets.slice(0, assignedWorkLimit);
                  const assignedWorkButtons = [
                    ...visibleTickets.map(ticket => {
                      return createButton({
                        label: ticket.reference,
                        variant:
                          behavior.getTicketQueueButtonVariant?.(ticket) ??
                          getTicketQueueButtonVariant(ticket),
                        onClick: () => {
                          void showTicket(ticket.reference);
                        },
                      });
                    }),
                    createButton({
                      label: labels.viewTicketQueue,
                      onClick: () => {
                        void showTicketQueue();
                      },
                    }),
                    createBackToAdminOptionsButton(),
                  ];

                  addSupportMessage(
                    config.formatters?.ticketQueue?.({
                      ...formatterContext,
                      tickets,
                    }) ?? formatQueueSummary(tickets, assignedWorkLimit),
                    customizeButtons({
                      slot: 'assigned-work',
                      defaultButtons: assignedWorkButtons,
                      tickets,
                    })
                  );
                })();
              },
            }),
          ]
        : []),
    ];

    return customizeButtons({
      slot: 'primary',
      defaultButtons,
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
