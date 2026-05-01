import {
  createButton,
  createMarkdownTextPart,
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
  CreateSupportTicketInput,
  MaybePromise,
  SupportButtonCustomizer,
  SupportFlowAdapter,
  SupportFlowBase,
  SupportLiveChatSession,
  SupportRequestInputButtonOverrides,
  StartSupportLiveChatInput,
  SupportTicket,
  SupportUserFlowCallbacks,
  SupportUserFlowValidationConfig,
  SupportUserIdentity,
  UpdateSupportLiveChatInput,
} from './supportFlowTypes';
import {
  createRequestInputValidator,
  deriveCustomerLabel,
  escapeMarkdown,
  formatLiveChatStatusLabel,
  formatTicketFullActivity,
  formatTicketRecentActivity,
  formatTicketStatusLabel,
  formatTimestamp,
  isOpenLiveChat,
  isPromiseLike,
  joinMarkdownLines,
  normalizeReference,
  resolveRequestInputButtonOverrides,
  resolveValidationSettings,
  validateSupportInput,
} from './supportFlowUtils';

export interface SupportUserFlowLabels {
  readonly startTicket: string;
  readonly startLiveChat: string;
  readonly viewTickets: string;
  readonly refreshStatus: string;
  readonly viewFullActivity: string;
  readonly addDetail: string;
  readonly backToSupportOptions: string;
  readonly refreshChat: string;
  readonly endLiveChat: string;
  readonly liveChatMessagePlaceholder: string;
  readonly liveChatMessageDescription: string;
  readonly liveChatWaitingPlaceholder: string;
  readonly liveChatWaitingDescription: string;
}

export interface SupportUserCreateTicketInputContext {
  readonly customer: SupportUserIdentity;
}

export interface SupportUserTicketInputContext {
  readonly customer: SupportUserIdentity;
  readonly ticket: SupportTicket;
}

export interface SupportUserLiveChatInputContext {
  readonly customer: SupportUserIdentity;
}

export interface SupportUserFlowRequestInputs {
  readonly createTicket?:
    | SupportRequestInputButtonOverrides<SupportUserCreateTicketInputContext>
    | undefined;
  readonly addTicketDetail?:
    | SupportRequestInputButtonOverrides<SupportUserTicketInputContext>
    | undefined;
  readonly startLiveChat?:
    | SupportRequestInputButtonOverrides<SupportUserLiveChatInputContext>
    | undefined;
}

export interface SupportUserFormatterContext {
  readonly customer: SupportUserIdentity;
  readonly brandName: string;
  readonly recentActivityLimit: number;
  readonly ticketListLimit: number;
}

export interface SupportUserTicketFormatterContext extends SupportUserFormatterContext {
  readonly ticket: SupportTicket;
}

export interface SupportUserTicketsFormatterContext extends SupportUserFormatterContext {
  readonly tickets: readonly SupportTicket[];
}

export interface SupportUserLiveChatFormatterContext extends SupportUserFormatterContext {
  readonly session: SupportLiveChatSession;
}

export interface SupportUserFlowFormatters {
  readonly openingMessage?:
    | ((context: SupportUserFormatterContext) => string)
    | undefined;
  readonly ticketSummary?:
    | ((context: SupportUserTicketFormatterContext) => string)
    | undefined;
  readonly ticketFullActivity?:
    | ((context: SupportUserTicketFormatterContext) => string)
    | undefined;
  readonly ticketList?:
    | ((context: SupportUserTicketsFormatterContext) => string)
    | undefined;
  readonly ticketCreated?:
    | ((context: SupportUserTicketFormatterContext) => string)
    | undefined;
  readonly ticketDetailAdded?:
    | ((
        context: SupportUserTicketFormatterContext & {
          readonly detail: string;
        }
      ) => string)
    | undefined;
  readonly liveChatDetails?:
    | ((context: SupportUserLiveChatFormatterContext) => string)
    | undefined;
  readonly liveChatEnded?:
    | ((context: SupportUserLiveChatFormatterContext) => string)
    | undefined;
}

export interface SupportUserFlowBehavior {
  readonly recentActivityLimit?: number | undefined;
  readonly ticketListLimit?: number | undefined;
  readonly isOpenLiveChat?:
    | ((session: SupportLiveChatSession) => boolean)
    | undefined;
  readonly canSendLiveChatMessage?:
    | ((session: SupportLiveChatSession) => boolean)
    | undefined;
}

export type SupportUserFlowButtonSlot =
  | 'primary'
  | 'ticket'
  | 'ticket-list'
  | 'live-chat-active'
  | 'live-chat-waiting'
  | 'live-chat-ended'
  | 'live-chat-persistent';

export interface SupportUserFlowButtonContext {
  readonly slot: SupportUserFlowButtonSlot;
  readonly defaultButtons: readonly MessageButton[];
  readonly customer: SupportUserIdentity;
  readonly tickets?: readonly SupportTicket[] | undefined;
  readonly ticket?: SupportTicket | undefined;
  readonly session?: SupportLiveChatSession | undefined;
}

export type SupportUserFlowButtonCustomizer =
  SupportButtonCustomizer<SupportUserFlowButtonContext>;

export interface SupportUserFlowConfig {
  readonly adapter?: SupportFlowAdapter | undefined;
  readonly callbacks?: SupportUserFlowCallbacks | undefined;
  readonly customer: SupportUserIdentity;
  readonly brandName?: string | undefined;
  readonly initialMessage?: string | undefined;
  readonly validation?: SupportUserFlowValidationConfig | undefined;
  readonly labels?: Partial<SupportUserFlowLabels> | undefined;
  readonly requestInputs?: SupportUserFlowRequestInputs | undefined;
  readonly formatters?: SupportUserFlowFormatters | undefined;
  readonly behavior?: SupportUserFlowBehavior | undefined;
  readonly customizeButtons?: SupportUserFlowButtonCustomizer | undefined;
  readonly liveChatPersistentButtons?:
    | SupportUserLiveChatPersistentButtonFactory
    | undefined;
}

export type SupportUserFlow = SupportFlowBase;

export interface SupportUserLiveChatPersistentButtonContext {
  readonly session: SupportLiveChatSession;
  readonly customer: SupportUserIdentity;
  readonly endLiveChat: () => void;
  readonly refresh: () => void;
}

export type SupportUserLiveChatPersistentButtonFactory = (
  context: SupportUserLiveChatPersistentButtonContext
) => readonly MessageButton[];

const DEFAULT_USER_LABELS: SupportUserFlowLabels = {
  startTicket: 'Start ticket',
  startLiveChat: 'Start live chat',
  viewTickets: 'View tickets',
  refreshStatus: 'Refresh status',
  viewFullActivity: 'View full activity',
  addDetail: 'Add detail',
  backToSupportOptions: 'Back to support options',
  refreshChat: 'Refresh chat',
  endLiveChat: 'End live chat',
  liveChatMessagePlaceholder: 'Type a live chat message...',
  liveChatMessageDescription: 'Live chat is active.',
  liveChatWaitingPlaceholder: 'Waiting for a support agent to join...',
  liveChatWaitingDescription: 'Live chat is waiting for an agent.',
};

function formatTicketSummary(
  ticket: SupportTicket,
  recentActivityLimit: number
): string {
  const latestMessage = ticket.messages[ticket.messages.length - 1];
  return joinMarkdownLines([
    `## Ticket ${escapeMarkdown(ticket.reference)}`,
    '',
    `- **Status:** ${escapeMarkdown(formatTicketStatusLabel(ticket.status))}`,
    `- **Priority:** ${escapeMarkdown(ticket.priority)}`,
    `- **Subject:** ${escapeMarkdown(ticket.subject)}`,
    ticket.assignedTo
      ? `- **Assigned to:** ${escapeMarkdown(ticket.assignedTo)}`
      : '- **Assigned to:** No agent assigned yet',
    `- **Last updated:** ${escapeMarkdown(formatTimestamp(ticket.updatedAt))}`,
    latestMessage
      ? `- **Latest update:** ${escapeMarkdown(latestMessage.body)}`
      : undefined,
    '',
    formatTicketRecentActivity(ticket, recentActivityLimit),
  ]);
}

function formatLiveChatDetails(session: SupportLiveChatSession): string {
  return joinMarkdownLines([
    '## Live chat',
    '',
    `- **Status:** ${escapeMarkdown(formatLiveChatStatusLabel(session.status))}`,
    `- **Estimated wait:** ${session.estimatedWaitMinutes} minutes`,
  ]);
}

function getLiveChatEndButtonId(sessionId: string): string {
  return `support-live-chat-end-${sessionId}`;
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

export function createSupportUserFlow(
  config: SupportUserFlowConfig
): SupportUserFlow {
  const {
    adapter,
    callbacks = {},
    customer,
    brandName = 'Support desk',
  } = config;
  const liveChatPersistentButtonIds = new Map<string, readonly string[]>();
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

  const defaultOpeningMessage = joinMarkdownLines([
    `## ${escapeMarkdown(brandName)} is ready to help`,
    '',
    'Choose a next step:',
  ]);
  const openingMessage =
    config.initialMessage ??
    config.formatters?.openingMessage?.(formatterContext) ??
    defaultOpeningMessage;
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

  const canCreateTicket = Boolean(
    callbacks.createTicket ?? adapter?.createTicket
  );
  const canListTickets = Boolean(
    callbacks.listTickets ?? adapter?.listCustomerTickets
  );
  const canAppendTicketMessage = Boolean(
    callbacks.appendTicketMessage ?? adapter?.appendTicketMessage
  );
  const canStartLiveChat = Boolean(
    callbacks.startLiveChat ?? adapter?.startLiveChat
  );
  const canUpdateLiveChat = Boolean(
    callbacks.updateLiveChat ?? adapter?.updateLiveChat
  );
  const canAppendLiveChatMessage = Boolean(
    callbacks.appendLiveChatMessage ?? adapter?.appendLiveChatMessage
  );
  const canGetLiveChat = Boolean(
    callbacks.getLiveChat ?? adapter?.getLiveChatById
  );
  const canUseLiveChat =
    canStartLiveChat &&
    canGetLiveChat &&
    canUpdateLiveChat &&
    canAppendLiveChatMessage;

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

  const formatUserTicketSummary = (ticket: SupportTicket): string => {
    const context: SupportUserTicketFormatterContext = {
      ...formatterContext,
      ticket,
    };

    return (
      config.formatters?.ticketSummary?.(context) ??
      formatTicketSummary(ticket, recentActivityLimit)
    );
  };

  const formatUserTicketFullActivity = (ticket: SupportTicket): string => {
    const context: SupportUserTicketFormatterContext = {
      ...formatterContext,
      ticket,
    };

    return (
      config.formatters?.ticketFullActivity?.(context) ??
      formatTicketFullActivity(ticket)
    );
  };

  const formatUserLiveChatDetails = (
    session: SupportLiveChatSession
  ): string => {
    const context: SupportUserLiveChatFormatterContext = {
      ...formatterContext,
      session,
    };

    return (
      config.formatters?.liveChatDetails?.(context) ??
      formatLiveChatDetails(session)
    );
  };

  const formatUserLiveChatEnded = (session: SupportLiveChatSession): string => {
    const context: SupportUserLiveChatFormatterContext = {
      ...formatterContext,
      session,
    };

    return (
      config.formatters?.liveChatEnded?.(context) ??
      joinMarkdownLines([
        '## Ended live chat',
        '',
        `- **Status:** ${escapeMarkdown(formatLiveChatStatusLabel(session.status))}`,
      ])
    );
  };

  const createTicket = async (
    input: CreateSupportTicketInput
  ): Promise<SupportTicket> => {
    if (callbacks.createTicket) {
      return callbacks.createTicket(input);
    }

    if (adapter?.createTicket) {
      return adapter.createTicket(input);
    }

    throw new Error('No support ticket creation callback was provided.');
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

  const listTickets = async (): Promise<readonly SupportTicket[]> => {
    if (callbacks.listTickets) {
      return callbacks.listTickets(customer);
    }

    if (adapter?.listCustomerTickets) {
      return adapter.listCustomerTickets(customer);
    }

    return [];
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

  const startLiveChat = async (
    input: StartSupportLiveChatInput
  ): Promise<SupportLiveChatSession> => {
    if (callbacks.startLiveChat) {
      return callbacks.startLiveChat(input);
    }

    if (adapter?.startLiveChat) {
      return adapter.startLiveChat(input);
    }

    throw new Error('No live chat start callback was provided.');
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

  const readInitialTickets = (): readonly SupportTicket[] => {
    if (!canListTickets) {
      return [];
    }

    let tickets: MaybePromise<readonly SupportTicket[]> | undefined;

    try {
      tickets = callbacks.listTickets
        ? callbacks.listTickets(customer)
        : adapter?.listCustomerTickets?.(customer);
    } catch {
      return [];
    }

    if (!tickets || isPromiseLike(tickets)) {
      if (tickets) {
        void tickets.catch(() => undefined);
      }
      return [];
    }

    return tickets;
  };

  const initialTickets = readInitialTickets();

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

  const getOpenLiveChat = async (): Promise<SupportLiveChatSession | null> => {
    if (callbacks.getOpenLiveChat) {
      return callbacks.getOpenLiveChat(customer);
    }

    if (!adapter?.listCustomerLiveChats) {
      return null;
    }

    const sessions = await adapter.listCustomerLiveChats(customer);
    return sessions.find(behavior.isOpenLiveChat ?? isOpenLiveChat) ?? null;
  };

  const showTicket = async (reference: string): Promise<void> => {
    const ticket = await getTicket(normalizeReference(reference));

    if (!ticket) {
      addSupportMessage(
        `I could not find ticket ${normalizeReference(reference)} yet. Double-check the reference or open a new ticket.`,
        createPrimaryButtons()
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

  const configureLiveChatInput = (): void => {
    useInputFieldStore.getState().setInputFieldParams({
      disabled: false,
      placeholder: labels.liveChatMessagePlaceholder,
      description: labels.liveChatMessageDescription,
      submitGuard: (value, submission) => {
        return (
          validateSupportInput(value, liveChatMessageValidation, submission) ===
          true
        );
      },
    });
  };

  const configureWaitingLiveChatInput = (): void => {
    useInputFieldStore.getState().setInputFieldParams({
      disabled: true,
      disabledPlaceholder: labels.liveChatWaitingPlaceholder,
      description: labels.liveChatWaitingDescription,
      submitGuard: null,
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

  const canCustomerSendLiveChatMessage = (
    session: SupportLiveChatSession
  ): boolean => {
    return (
      behavior.canSendLiveChatMessage?.(session) ??
      (session.status === 'active' && Boolean(session.agent))
    );
  };

  const removeLiveChatPersistentButtons = (sessionId: string): void => {
    const ids = liveChatPersistentButtonIds.get(sessionId) ?? [];
    ids.forEach(id => {
      usePersistentButtonStore.getState().removeButton(id);
    });
    liveChatPersistentButtonIds.delete(sessionId);
  };

  const addLiveChatPersistentButtons = (
    session: SupportLiveChatSession
  ): void => {
    if (session.status === 'ended') {
      removeLiveChatPersistentButtons(session.id);
      return;
    }

    removeLiveChatPersistentButtons(session.id);

    const context: SupportUserLiveChatPersistentButtonContext = {
      session,
      customer,
      endLiveChat: () => {
        void endLiveChat(session);
      },
      refresh: () => {
        void showLiveChatSession(session.id);
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
      `support-live-chat-user-custom-${session.id}`
    );

    buttons.forEach(button => {
      usePersistentButtonStore.getState().addButton(button);
    });
    liveChatPersistentButtonIds.set(
      session.id,
      buttons.map(button => button.id)
    );
  };

  const addLiveChatInputMessage = (session: SupportLiveChatSession): void => {
    addLiveChatPersistentButtons(session);
    configureLiveChatInput();
    addSupportMessage(
      formatUserLiveChatDetails(session),
      customizeButtons({
        slot: 'live-chat-active',
        defaultButtons: [],
        session,
      }),
      createLiveChatResponseCallback(session)
    );
  };

  const createLiveChatResponseCallback = (
    session: SupportLiveChatSession
  ): ((submission?: InputSubmission) => void) => {
    return submission => {
      const body = submission?.text.trim() ?? '';
      if (!body) {
        addLiveChatInputMessage(session);
        return;
      }

      void (async () => {
        const latestSession = canGetLiveChat
          ? await getLiveChat(session.id)
          : session;
        if (!latestSession || !canCustomerSendLiveChatMessage(latestSession)) {
          addSupportMessage(
            'Live chat is waiting for a support agent. You can send another message once an agent has joined.',
            [createRefreshLiveChatButton(session.id)]
          );
          configureWaitingLiveChatInput();
          return;
        }

        const updatedSession = await appendLiveChatMessage({
          sessionId: session.id,
          author: 'customer',
          authorLabel: deriveCustomerLabel(customer),
          body,
        });

        addLiveChatInputMessage(updatedSession);
      })();
    };
  };

  const endLiveChat = async (
    session: SupportLiveChatSession
  ): Promise<void> => {
    const updatedSession = await updateLiveChat({
      sessionId: session.id,
      status: 'ended',
      queuePosition: 0,
      estimatedWaitMinutes: 0,
    });
    removeLiveChatPersistentButtons(session.id);
    resetLiveChatInput();

    addSupportMessage(
      formatUserLiveChatEnded(updatedSession),
      createPrimaryButtons()
    );
  };

  const createRefreshLiveChatButton = (sessionId: string): MessageButton => {
    return createButton({
      label: labels.refreshChat,
      onClick: () => {
        void showLiveChatSession(sessionId);
      },
    });
  };

  const showLiveChatSession = async (sessionId: string): Promise<void> => {
    const session = await getLiveChat(sessionId);

    if (!session) {
      addSupportMessage(
        'That live chat was not found.',
        createPrimaryButtons()
      );
      return;
    }

    renderLiveChatSession(session);
  };

  const renderLiveChatSession = (session: SupportLiveChatSession): void => {
    if (canCustomerSendLiveChatMessage(session)) {
      addLiveChatInputMessage(session);
      return;
    }

    if (session.status === 'ended') {
      removeLiveChatPersistentButtons(session.id);
      resetLiveChatInput();
      addSupportMessage(
        formatUserLiveChatDetails(session),
        customizeButtons({
          slot: 'live-chat-ended',
          defaultButtons: createPrimaryButtons(),
          session,
        })
      );
      return;
    }

    addLiveChatPersistentButtons(session);
    configureWaitingLiveChatInput();
    addSupportMessage(
      formatUserLiveChatDetails(session),
      customizeButtons({
        slot: 'live-chat-waiting',
        defaultButtons: [createRefreshLiveChatButton(session.id)],
        session,
      })
    );
  };

  const redirectToOpenLiveChat = async (): Promise<boolean> => {
    const openSession = await getOpenLiveChat();

    if (!openSession) {
      return false;
    }

    renderLiveChatSession(openSession);
    return true;
  };

  const createAddDetailButton = (ticket: SupportTicket): MessageButton => {
    const inputContext: SupportUserTicketInputContext = {
      customer,
      ticket,
    };

    return createButton(
      createRequestInputButtonDef({
        initialLabel: labels.addDetail,
        inputPromptMessage: `Share the next detail you want added to ${ticket.reference}.`,
        placeholder: 'The error started after we rotated SSO certificates...',
        inputDescription:
          'Use this to add reproduction steps, screenshots, timing, or business impact.',
        minMessageLength: ticketDetailValidation.minMessageLength,
        minMessageLengthMessage: ticketDetailValidation.minMessageLengthMessage,
        validator: createRequestInputValidator(ticketDetailValidation),
        ...resolveRequestInputButtonOverrides(
          config.requestInputs?.addTicketDetail,
          inputContext
        ),
        onSuccess: async detail => {
          const updatedTicket = await appendTicketMessage({
            reference: ticket.reference,
            author: 'customer',
            authorLabel: deriveCustomerLabel(customer),
            body: detail,
          });

          addSupportMessage(
            config.formatters?.ticketDetailAdded?.({
              ...formatterContext,
              ticket: updatedTicket,
              detail,
            }) ??
              joinMarkdownLines([
                `## Added your note to ${escapeMarkdown(updatedTicket.reference)}`,
                '',
                'The support team will see the new detail the next time they review the ticket.',
                '',
                '### New detail',
                '',
                escapeMarkdown(detail),
              ]),
            createTicketButtons(updatedTicket)
          );
        },
      }),
      {
        abortCallback: () => {
          addAbortRecoveryMessage(
            `No new detail was added to ${ticket.reference}. You can return to the ticket whenever you are ready.`,
            createTicketButtons(ticket)
          );
        },
      }
    );
  };

  const createStartLiveChatRequestButton = (): MessageButton => {
    const inputContext: SupportUserLiveChatInputContext = {
      customer,
    };

    return createButton(
      createRequestInputButtonDef({
        initialLabel: labels.startLiveChat,
        inputPromptMessage:
          'What do you need help with right now? I will queue a live chat handoff.',
        placeholder: 'We are blocked from deploying to production...',
        inputDescription:
          'Mention urgency, customer impact, and what you have already tried.',
        minMessageLength: liveChatInitialMessageValidation.minMessageLength,
        minMessageLengthMessage:
          liveChatInitialMessageValidation.minMessageLengthMessage,
        validator: createRequestInputValidator(
          liveChatInitialMessageValidation
        ),
        ...resolveRequestInputButtonOverrides(
          config.requestInputs?.startLiveChat,
          inputContext
        ),
        onSuccess: async summary => {
          const session = await startLiveChat({
            summary,
            requestedBy: 'customer',
            customer,
          });

          renderLiveChatSession(session);
        },
      }),
      {
        abortCallback: () => {
          addAbortRecoveryMessage(
            'Live chat request cancelled. You can start a ticket or try live chat again when you are ready.',
            createPrimaryButtons()
          );
        },
      }
    );
  };

  const createLiveChatButton = (): MessageButton => {
    return createButton({
      label: labels.startLiveChat,
      onClick: () => {
        void (async () => {
          const didRedirect = await redirectToOpenLiveChat();

          if (!didRedirect) {
            createStartLiveChatRequestButton().onClick?.();
          }
        })();
      },
    });
  };

  const showInitialOptions = async (): Promise<void> => {
    const tickets = canListTickets ? await listTickets() : [];
    addSupportMessage(openingMessage, createPrimaryButtons(tickets));
  };

  const createBackToSupportOptionsButton = (): MessageButton => {
    return createButton({
      label: labels.backToSupportOptions,
      onClick: () => {
        void showInitialOptions();
      },
    });
  };

  const createTicketButtons = (
    ticket: SupportTicket
  ): readonly MessageButton[] => {
    const defaultButtons = [
      createButton({
        label: labels.refreshStatus,
        onClick: () => {
          void showTicket(ticket.reference);
        },
      }),
      createButton({
        label: labels.viewFullActivity,
        onClick: () => {
          void showFullActivity(ticket.reference);
        },
      }),
      ...(canAppendTicketMessage ? [createAddDetailButton(ticket)] : []),
      ...(canListTickets
        ? [
            createButton({
              label: labels.viewTickets,
              onClick: () => {
                void showMyTickets();
              },
            }),
          ]
        : []),
      createBackToSupportOptionsButton(),
    ];

    return customizeButtons({
      slot: 'ticket',
      defaultButtons,
      ticket,
    });
  };

  const showMyTickets = async (): Promise<void> => {
    const tickets = await listTickets();

    if (!tickets.length) {
      addSupportMessage(
        'You do not have any tickets yet. Open one whenever you want a tracked follow-up.',
        createPrimaryButtons()
      );
      return;
    }

    const visibleTickets = tickets.slice(0, ticketListLimit);
    const ticketLines = visibleTickets
      .map(ticket => {
        return `- **${escapeMarkdown(ticket.reference)} (${escapeMarkdown(ticket.priority)}):** ${escapeMarkdown(ticket.subject)} (${escapeMarkdown(formatTicketStatusLabel(ticket.status))})`;
      })
      .join('\n');
    const defaultButtons = [
      ...visibleTickets.map(ticket => {
        return createButton({
          label: ticket.reference,
          onClick: () => {
            void showTicket(ticket.reference);
          },
        });
      }),
      ...(canCreateTicket ? [createOpenTicketButton()] : []),
      createBackToSupportOptionsButton(),
    ];

    addSupportMessage(
      config.formatters?.ticketList?.({
        ...formatterContext,
        tickets,
      }) ??
        joinMarkdownLines([
          '## Here are your latest tickets:',
          '',
          ticketLines,
        ]),
      customizeButtons({
        slot: 'ticket-list',
        defaultButtons,
        tickets,
      })
    );
  };

  const createOpenTicketButton = (): MessageButton => {
    const inputContext: SupportUserCreateTicketInputContext = {
      customer,
    };

    return createButton(
      createRequestInputButtonDef({
        initialLabel: labels.startTicket,
        inputPromptMessage:
          'Describe the issue and I will create a tracked support ticket.',
        placeholder: 'Our team cannot invite new users after enabling SSO.',
        inputDescription:
          'Include the symptom, impact, and any troubleshooting you have already tried.',
        minMessageLength: ticketSummaryValidation.minMessageLength,
        minMessageLengthMessage:
          ticketSummaryValidation.minMessageLengthMessage,
        validator: createRequestInputValidator(ticketSummaryValidation),
        ...resolveRequestInputButtonOverrides(
          config.requestInputs?.createTicket,
          inputContext
        ),
        onSuccess: async summary => {
          const ticket = await createTicket({
            customer,
            summary,
          });

          addSupportMessage(
            config.formatters?.ticketCreated?.({
              ...formatterContext,
              ticket,
            }) ??
              joinMarkdownLines([
                `## ${escapeMarkdown(ticket.reference)} is open for ${escapeMarkdown(deriveCustomerLabel(customer))}`,
                '',
                `- **Subject:** ${escapeMarkdown(ticket.subject)}`,
                `- **Priority:** ${escapeMarkdown(ticket.priority)}`,
                '',
                '### Request details',
                '',
                escapeMarkdown(ticket.summary),
                '',
                'Add more detail or review status from here.',
              ]),
            createTicketButtons(ticket)
          );
        },
      }),
      {
        abortCallback: () => {
          addAbortRecoveryMessage(
            'Ticket creation cancelled. You can open a new ticket whenever you are ready.',
            createPrimaryButtons()
          );
        },
      }
    );
  };

  function createPrimaryButtons(
    tickets: readonly SupportTicket[] = initialTickets
  ): readonly MessageButton[] {
    const defaultButtons = [
      ...(canCreateTicket ? [createOpenTicketButton()] : []),
      ...(canUseLiveChat ? [createLiveChatButton()] : []),
      ...(canListTickets && tickets.length > 0
        ? [
            createButton({
              label: labels.viewTickets,
              onClick: () => {
                void showMyTickets();
              },
            }),
          ]
        : []),
    ];

    return customizeButtons({
      slot: 'primary',
      defaultButtons,
      tickets,
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
        const didRedirect = await redirectToOpenLiveChat();

        if (!didRedirect) {
          await showInitialOptions();
        }
      })();
    },
  };
}
