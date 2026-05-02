import {
  type InputSubmission,
  type MessageButton,
  useInputFieldStore,
  usePersistentButtonStore,
} from 'react-actions-chat';
import type {
  SupportAgentIdentity,
  SupportInputValidationSettings,
  SupportLiveChatQueueFilter,
  SupportLiveChatSession,
} from '../../supportFlowTypes';
import {
  createListFilterButtons,
  paginateItems,
  resolveActiveListFilter,
  validateSupportInput,
  withPersistentButtonIds,
  type SupportPaginationPage,
} from '../../supportFlowUtils';
import { formatLiveChatEndedMessage } from './actionMessages';
import {
  createAdminJoinLiveChatButton,
  createAdminLiveChatButtons,
  createLiveChatPersistentDefaultButtons,
  createLiveChatPaginationButtons,
  createLiveChatQueueButtons,
  createRefreshLiveChatQueueButton,
  getLiveChatQueueButtonVariant,
} from './buttons';
import type { SupportAdminFlowServices } from '../services';
import type {
  SupportAdminFlowButtonContext,
  SupportAdminFlowConfig,
  SupportAdminFlowLabels,
  SupportAdminFormatterContext,
  SupportAdminLiveChatQueueFilterContext,
  SupportAdminLiveChatQueueFilterOption,
  SupportAdminLiveChatPersistentButtonContext,
} from '../types';

type CustomizeAdminButtons = (
  context: Omit<SupportAdminFlowButtonContext, 'agent' | 'agentLabel'>
) => readonly MessageButton[];

interface CreateAdminLiveChatFlowOptions {
  readonly config: SupportAdminFlowConfig;
  readonly agent: SupportAgentIdentity;
  readonly agentLabel: string;
  readonly labels: SupportAdminFlowLabels;
  readonly behavior: NonNullable<SupportAdminFlowConfig['behavior']>;
  readonly formatterContext: SupportAdminFormatterContext;
  readonly liveChatQueueLimit: number;
  readonly liveChatMessageValidation: SupportInputValidationSettings;
  readonly canUpdateLiveChat: boolean;
  readonly canAppendLiveChatMessage: boolean;
  readonly canGetTicket: boolean;
  readonly canOpenLiveChatQueue: boolean;
  readonly listLiveChatQueue: SupportAdminFlowServices['listLiveChatQueue'];
  readonly getLiveChat: SupportAdminFlowServices['getLiveChat'];
  readonly updateLiveChat: SupportAdminFlowServices['updateLiveChat'];
  readonly appendLiveChatMessage: SupportAdminFlowServices['appendLiveChatMessage'];
  readonly formatAdminLiveChatQueue: (
    sessions: readonly SupportLiveChatSession[],
    page: SupportPaginationPage<SupportLiveChatSession>,
    filterState?: {
      readonly activeFilter?: SupportAdminLiveChatQueueFilterOption | undefined;
      readonly filterOptions:
        | readonly SupportAdminLiveChatQueueFilterOption[]
        | undefined;
    }
  ) => string;
  readonly formatAdminLiveChatDetails: (
    session: SupportLiveChatSession
  ) => string;
  readonly addSupportMessage: (
    markdown: string,
    buttons: readonly MessageButton[],
    userResponseCallback?: (submission?: InputSubmission) => void
  ) => void;
  readonly createPrimaryButtons: () => readonly MessageButton[];
  readonly createRefreshLiveChatButton: (sessionId: string) => MessageButton;
  readonly createBackToAdminOptionsButton: () => MessageButton;
  readonly showTicket: (reference: string) => void | Promise<void>;
  readonly customizeButtons: CustomizeAdminButtons;
}

export interface AdminLiveChatFlow {
  readonly renderLiveChatSession: (session: SupportLiveChatSession) => void;
  readonly resetLiveChatState: () => void;
  readonly showLiveChat: (sessionId: string) => Promise<void>;
  readonly showLiveChatQueue: (
    pageIndex?: number,
    activeFilterId?: string
  ) => Promise<void>;
}

export function createAdminLiveChatFlow({
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
  showTicket,
  customizeButtons,
}: CreateAdminLiveChatFlowOptions): AdminLiveChatFlow {
  const liveChatPersistentButtonIds = new Map<string, readonly string[]>();

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

  const resetLiveChatState = (): void => {
    removeAllLiveChatPersistentButtons();
    resetLiveChatInput();
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
      }) ?? formatLiveChatEndedMessage(updatedSession),
      createLiveChatButtons(updatedSession)
    );
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
    const defaultButtons = createLiveChatPersistentDefaultButtons({
      session,
      labels,
      injectedButtons,
      endLiveChat: () => {
        void endLiveChat(session);
      },
    });
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

  const resolveLiveChatFilter = (
    activeFilter: SupportAdminLiveChatQueueFilterOption | undefined,
    filterContext: SupportAdminLiveChatQueueFilterContext
  ): SupportLiveChatQueueFilter | undefined => {
    if (!activeFilter?.filter) {
      return undefined;
    }

    return typeof activeFilter.filter === 'function'
      ? activeFilter.filter(filterContext)
      : activeFilter.filter;
  };

  const applyLiveChatFilterPredicate = (
    sessions: readonly SupportLiveChatSession[],
    activeFilter: SupportAdminLiveChatQueueFilterOption | undefined,
    filterContext: SupportAdminLiveChatQueueFilterContext
  ): readonly SupportLiveChatSession[] => {
    const predicate = activeFilter?.predicate;

    if (!predicate) {
      return sessions;
    }

    return sessions.filter(session => predicate(session, filterContext));
  };

  const showLiveChatQueue = async (
    pageIndex = 0,
    activeFilterId?: string
  ): Promise<void> => {
    const filterOptions = config.filterOptions?.liveChatQueue ?? [];
    const activeFilter = resolveActiveListFilter(filterOptions, activeFilterId);
    const filterContext: SupportAdminLiveChatQueueFilterContext = {
      agent,
      agentLabel,
    };
    const filterButtons = createListFilterButtons({
      filterOptions,
      activeFilterId: activeFilter?.id,
      showFilter: nextFilterId => {
        void showLiveChatQueue(0, nextFilterId);
      },
      abortFilter: () => {
        void showLiveChatQueue(pageIndex, activeFilter?.id);
      },
    });
    const isFiltered = Boolean(activeFilter?.filter ?? activeFilter?.predicate);
    const sessions = applyLiveChatFilterPredicate(
      await listLiveChatQueue(
        resolveLiveChatFilter(activeFilter, filterContext)
      ),
      activeFilter,
      filterContext
    );

    if (!sessions.length) {
      addSupportMessage(
        activeFilter && isFiltered
          ? `No live chats match ${activeFilter.label}.`
          : 'The live chat queue is empty right now.',
        filterButtons.length
          ? [
              ...filterButtons,
              createRefreshLiveChatQueueButton({
                labels,
                pageIndex: 0,
                showLiveChatQueue: nextPageIndex => {
                  void showLiveChatQueue(nextPageIndex, activeFilter?.id);
                },
              }),
              createBackToAdminOptionsButton(),
            ]
          : createPrimaryButtons()
      );
      return;
    }

    const page = paginateItems(sessions, pageIndex, liveChatQueueLimit);
    const visibleSessions = page.visibleItems;
    const defaultButtons = [
      ...filterButtons,
      ...createLiveChatQueueButtons({
        sessions: visibleSessions,
        getVariant: session =>
          behavior.getLiveChatQueueButtonVariant?.(session) ??
          getLiveChatQueueButtonVariant(session),
        showLiveChat: sessionId => {
          void showLiveChat(sessionId);
        },
      }),
      ...createLiveChatPaginationButtons({
        page,
        labels,
        showPage: nextPageIndex => {
          void showLiveChatQueue(nextPageIndex, activeFilter?.id);
        },
      }),
      createRefreshLiveChatQueueButton({
        labels,
        pageIndex: page.pageIndex,
        showLiveChatQueue: nextPageIndex => {
          void showLiveChatQueue(nextPageIndex, activeFilter?.id);
        },
      }),
      createBackToAdminOptionsButton(),
    ];

    addSupportMessage(
      formatAdminLiveChatQueue(sessions, page, {
        activeFilter,
        filterOptions,
      }),
      customizeButtons({
        slot: 'live-chat-queue',
        defaultButtons,
        sessions,
        visibleSessions,
        currentPage: page.currentPage,
        pageCount: page.pageCount,
        pageSize: page.pageSize,
        totalSessions: page.totalItems,
        activeFilterId: activeFilter?.id,
        activeFilterLabel: activeFilter?.label,
        filterOptions,
      })
    );
  };

  const createLiveChatButtons = (
    session: SupportLiveChatSession
  ): readonly MessageButton[] => {
    return createAdminLiveChatButtons({
      session,
      labels,
      canUpdateLiveChat,
      canGetTicket,
      canOpenLiveChatQueue,
      createJoinLiveChatButton: liveChatSession => {
        return createAdminJoinLiveChatButton({
          session: liveChatSession,
          agent,
          agentLabel,
          labels,
          behavior,
          formatters: config.formatters,
          formatterContext,
          listLiveChatQueue,
          updateLiveChat,
          removeLiveChatPersistentButtons,
          resetLiveChatInput,
          addSupportMessage,
          renderLiveChatSession,
        });
      },
      createRefreshLiveChatButton,
      createBackToAdminOptionsButton,
      showTicket: reference => {
        void showTicket(reference);
      },
      showLiveChatQueue: () => {
        void showLiveChatQueue();
      },
      customizeButtons,
    });
  };

  return {
    renderLiveChatSession,
    resetLiveChatState,
    showLiveChat,
    showLiveChatQueue,
  };
}
