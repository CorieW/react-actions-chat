import { createButton, type MessageButton } from 'react-actions-chat';
import type {
  SupportAgentIdentity,
  SupportLiveChatSession,
} from '../../supportFlowTypes';
import {
  deriveAgentLabel,
  type SupportPaginationPage,
} from '../../supportFlowUtils';
import {
  formatLiveChatJoinedMessage,
  formatLiveChatLeftMessage,
} from './actionMessages';
import type { SupportAdminFlowServices } from '../services';
import type {
  SupportAdminFlowButtonContext,
  SupportAdminFlowConfig,
  SupportAdminFlowLabels,
  SupportAdminFormatterContext,
} from '../types';

/**
 * Persistent button candidate before a stable ID is guaranteed.
 */
type PersistentButtonCandidate = MessageButton & {
  /**
   * Stable identifier for this value.
   */
  readonly id?: string | undefined;
};

/**
 * Returns live chat end button ID.
 *
 * @param sessionId - Live chat session ID to look up or update.
 */
function getLiveChatEndButtonId(sessionId: string): string {
  return `support-admin-live-chat-end-${sessionId}`;
}

/**
 * Returns live chat queue button variant.
 *
 * @param session - Live chat session to inspect, format, or update.
 */
export function getLiveChatQueueButtonVariant(
  session: SupportLiveChatSession
): MessageButton['variant'] {
  return session.status === 'active' && session.agent ? 'error' : 'success';
}

/**
 * Options used to create live chat queue buttons.
 */
interface CreateLiveChatQueueButtonsOptions {
  /**
   * Live-chat sessions in the current list or queue.
   */
  readonly sessions: readonly SupportLiveChatSession[];
  /**
   * Returns variant.
   *
   * @param session - Live chat session to inspect or render.
   */
  readonly getVariant: (
    session: SupportLiveChatSession
  ) => MessageButton['variant'];
  /**
   * Shows a live chat session.
   *
   * @param sessionId - Live chat session ID to look up.
   */
  readonly showLiveChat: (sessionId: string) => void;
}

/**
 * Creates live chat queue buttons.
 *
 * @param options - Options for creating the live chat queue buttons.
 */
export function createLiveChatQueueButtons({
  sessions,
  getVariant,
  showLiveChat,
}: CreateLiveChatQueueButtonsOptions): readonly MessageButton[] {
  return sessions.map(session => {
    return createButton({
      label: session.id,
      variant: getVariant(session),
      onClick: () => {
        showLiveChat(session.id);
      },
    });
  });
}

/**
 * Options used to create live chat pagination buttons.
 */
interface CreateLiveChatPaginationButtonsOptions {
  /**
   * Page of records returned by the pagination helper.
   */
  readonly page: SupportPaginationPage<SupportLiveChatSession>;
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportAdminFlowLabels;
  /**
   * Shows a requested list page.
   *
   * @param pageIndex - Zero-based page index to show.
   */
  readonly showPage: (pageIndex: number) => void;
}

/**
 * Creates live chat pagination buttons.
 *
 * @param options - Options for creating the live chat pagination buttons.
 */
export function createLiveChatPaginationButtons({
  page,
  labels,
  showPage,
}: CreateLiveChatPaginationButtonsOptions): readonly MessageButton[] {
  return [
    ...(page.pageIndex > 0
      ? [
          createButton({
            label: labels.previousLiveChats,
            onClick: () => {
              showPage(page.pageIndex - 1);
            },
          }),
        ]
      : []),
    ...(page.pageIndex < page.pageCount - 1
      ? [
          createButton({
            label: labels.nextLiveChats,
            onClick: () => {
              showPage(page.pageIndex + 1);
            },
          }),
        ]
      : []),
  ];
}

/**
 * Options used to create refresh live chat queue button.
 */
interface CreateRefreshLiveChatQueueButtonOptions {
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportAdminFlowLabels;
  /**
   * Zero-based page index currently being rendered.
   */
  readonly pageIndex: number;
  /**
   * Shows the live chat queue.
   *
   * @param pageIndex - Zero-based page index to show.
   */
  readonly showLiveChatQueue: (pageIndex: number) => void;
}

/**
 * Creates a refresh live chat queue button.
 *
 * @param options - Options for creating the refresh live chat queue button.
 */
export function createRefreshLiveChatQueueButton({
  labels,
  pageIndex,
  showLiveChatQueue,
}: CreateRefreshLiveChatQueueButtonOptions): MessageButton {
  return createButton({
    label: labels.refreshLiveChats,
    onClick: () => {
      showLiveChatQueue(pageIndex);
    },
  });
}

/**
 * Options used to create live chat persistent default buttons.
 */
interface CreateLiveChatPersistentDefaultButtonsOptions {
  /**
   * Live-chat session handled by this flow or helper.
   */
  readonly session: SupportLiveChatSession;
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportAdminFlowLabels;
  /**
   * Buttons injected into the rendered button list.
   */
  readonly injectedButtons: readonly MessageButton[];
  /**
   * Service used to end a live-chat session.
   */
  readonly endLiveChat: () => void;
}

/**
 * Creates default persistent live chat buttons.
 *
 * @param options - Options for creating the live chat persistent default buttons.
 */
export function createLiveChatPersistentDefaultButtons({
  session,
  labels,
  injectedButtons,
  endLiveChat,
}: CreateLiveChatPersistentDefaultButtonsOptions): readonly PersistentButtonCandidate[] {
  return [
    {
      id: getLiveChatEndButtonId(session.id),
      label: labels.endLiveChat,
      variant: 'error',
      onClick: endLiveChat,
    },
    ...injectedButtons,
  ];
}

/**
 * Options used to create admin join live chat button.
 */
interface CreateAdminJoinLiveChatButtonOptions {
  /**
   * Live-chat session handled by this flow or helper.
   */
  readonly session: SupportLiveChatSession;
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
  readonly behavior: SupportAdminFlowConfig['behavior'];
  /**
   * Formatter overrides used by this flow or helper.
   */
  readonly formatters: SupportAdminFlowConfig['formatters'];
  /**
   * Shared context passed to formatter functions.
   */
  readonly formatterContext: SupportAdminFormatterContext;
  /**
   * Service used to list live-chat queue sessions.
   */
  readonly listLiveChatQueue: SupportAdminFlowServices['listLiveChatQueue'];
  /**
   * Service used to update a live-chat session.
   */
  readonly updateLiveChat: SupportAdminFlowServices['updateLiveChat'];
  /**
   * Removes persistent buttons for a live chat session.
   *
   * @param sessionId - Live chat session ID to look up.
   */
  readonly removeLiveChatPersistentButtons: (sessionId: string) => void;
  /**
   * Resets the live chat input.
   */
  readonly resetLiveChatInput: () => void;
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
   * Renders a live chat session into the transcript.
   *
   * @param session - Live chat session to inspect or render.
   */
  readonly renderLiveChatSession: (session: SupportLiveChatSession) => void;
}

/**
 * Creates an admin join live chat button.
 *
 * @param options - Options for creating the admin join live chat button.
 */
export function createAdminJoinLiveChatButton({
  session,
  agent,
  agentLabel,
  labels,
  behavior,
  formatters,
  formatterContext,
  listLiveChatQueue,
  updateLiveChat,
  removeLiveChatPersistentButtons,
  resetLiveChatInput,
  addSupportMessage,
  renderLiveChatSession,
}: CreateAdminJoinLiveChatButtonOptions): MessageButton {
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
            behavior?.getRequeuedLiveChatPosition?.({
              session,
              queuedSessions,
            }) ?? queuedSessions.length + 1;
          const updatedSession = await updateLiveChat({
            sessionId: session.id,
            status: 'queued',
            queuePosition,
            estimatedWaitMinutes:
              behavior?.getRequeuedLiveChatEstimatedWaitMinutes?.({
                session,
                queuedSessions,
                queuePosition,
              }) ?? 2 + queuedSessions.length * 3,
            agent: null,
          });

          removeLiveChatPersistentButtons(session.id);
          resetLiveChatInput();
          addSupportMessage(
            formatters?.liveChatLeft?.({
              ...formatterContext,
              session: updatedSession,
            }) ?? formatLiveChatLeftMessage(updatedSession),
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
          formatters?.liveChatJoined?.({
            ...formatterContext,
            session: updatedSession,
          }) ?? formatLiveChatJoinedMessage(updatedSession, agentLabel),
          []
        );
        renderLiveChatSession(updatedSession);
      })();
    },
  });
}

/**
 * Button customization hook scoped to admin flow internals.
 *
 * @param context - Context object available to this resolver.
 */
type CustomizeAdminButtons = (
  context: Omit<SupportAdminFlowButtonContext, 'agent' | 'agentLabel'>
) => readonly MessageButton[];

/**
 * Options used to create admin live chat buttons.
 */
interface CreateAdminLiveChatButtonsOptions {
  /**
   * Live-chat session handled by this flow or helper.
   */
  readonly session: SupportLiveChatSession;
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportAdminFlowLabels;
  /**
   * Whether live-chat updates are available.
   */
  readonly canUpdateLiveChat: boolean;
  /**
   * Whether individual ticket lookup is available.
   */
  readonly canGetTicket: boolean;
  /**
   * Whether opening the live-chat queue is available.
   */
  readonly canOpenLiveChatQueue: boolean;
  /**
   * Creates join live chat button.
   *
   * @param session - Live chat session to inspect or render.
   */
  readonly createJoinLiveChatButton: (
    session: SupportLiveChatSession
  ) => MessageButton;
  /**
   * Creates a button that refreshes a live chat session.
   *
   * @param sessionId - Live chat session ID to look up.
   */
  readonly createRefreshLiveChatButton: (sessionId: string) => MessageButton;
  /**
   * Factory used to create the admin options navigation button.
   */
  readonly createBackToAdminOptionsButton: () => MessageButton;
  /**
   * Shows a support ticket.
   *
   * @param reference - Ticket reference to look up.
   */
  readonly showTicket: (reference: string) => void;
  /**
   * Handler used to render the live-chat queue.
   */
  readonly showLiveChatQueue: () => void;
  /**
   * Hook used to customize admin live-chat buttons before rendering.
   */
  readonly customizeButtons: CustomizeAdminButtons;
}

/**
 * Creates admin live chat buttons.
 *
 * @param options - Options for creating the admin live chat buttons.
 */
export function createAdminLiveChatButtons({
  session,
  labels,
  canUpdateLiveChat,
  canGetTicket,
  canOpenLiveChatQueue,
  createJoinLiveChatButton,
  createRefreshLiveChatButton,
  createBackToAdminOptionsButton,
  showTicket,
  showLiveChatQueue,
  customizeButtons,
}: CreateAdminLiveChatButtonsOptions): readonly MessageButton[] {
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
              showTicket(ticketReference);
            },
          }),
        ]
      : []),
    ...(canOpenLiveChatQueue
      ? [
          createButton({
            label: labels.backToLiveChatQueue,
            onClick: showLiveChatQueue,
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
}
