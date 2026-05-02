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

type PersistentButtonCandidate = MessageButton & {
  readonly id?: string | undefined;
};

function getLiveChatEndButtonId(sessionId: string): string {
  return `support-admin-live-chat-end-${sessionId}`;
}

export function getLiveChatQueueButtonVariant(
  session: SupportLiveChatSession
): MessageButton['variant'] {
  return session.status === 'active' && session.agent ? 'error' : 'success';
}

interface CreateLiveChatQueueButtonsOptions {
  readonly sessions: readonly SupportLiveChatSession[];
  readonly getVariant: (
    session: SupportLiveChatSession
  ) => MessageButton['variant'];
  readonly showLiveChat: (sessionId: string) => void;
}

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

interface CreateLiveChatPaginationButtonsOptions {
  readonly page: SupportPaginationPage<SupportLiveChatSession>;
  readonly labels: SupportAdminFlowLabels;
  readonly showPage: (pageIndex: number) => void;
}

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

interface CreateRefreshLiveChatQueueButtonOptions {
  readonly labels: SupportAdminFlowLabels;
  readonly pageIndex: number;
  readonly showLiveChatQueue: (pageIndex: number) => void;
}

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

interface CreateLiveChatPersistentDefaultButtonsOptions {
  readonly session: SupportLiveChatSession;
  readonly labels: SupportAdminFlowLabels;
  readonly injectedButtons: readonly MessageButton[];
  readonly endLiveChat: () => void;
}

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

interface CreateAdminJoinLiveChatButtonOptions {
  readonly session: SupportLiveChatSession;
  readonly agent: SupportAgentIdentity;
  readonly agentLabel: string;
  readonly labels: SupportAdminFlowLabels;
  readonly behavior: SupportAdminFlowConfig['behavior'];
  readonly formatters: SupportAdminFlowConfig['formatters'];
  readonly formatterContext: SupportAdminFormatterContext;
  readonly listLiveChatQueue: SupportAdminFlowServices['listLiveChatQueue'];
  readonly updateLiveChat: SupportAdminFlowServices['updateLiveChat'];
  readonly removeLiveChatPersistentButtons: (sessionId: string) => void;
  readonly resetLiveChatInput: () => void;
  readonly addSupportMessage: (
    markdown: string,
    buttons: readonly MessageButton[]
  ) => void;
  readonly renderLiveChatSession: (session: SupportLiveChatSession) => void;
}

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

type CustomizeAdminButtons = (
  context: Omit<SupportAdminFlowButtonContext, 'agent' | 'agentLabel'>
) => readonly MessageButton[];

interface CreateAdminLiveChatButtonsOptions {
  readonly session: SupportLiveChatSession;
  readonly labels: SupportAdminFlowLabels;
  readonly canUpdateLiveChat: boolean;
  readonly canGetTicket: boolean;
  readonly canOpenLiveChatQueue: boolean;
  readonly createJoinLiveChatButton: (
    session: SupportLiveChatSession
  ) => MessageButton;
  readonly createRefreshLiveChatButton: (sessionId: string) => MessageButton;
  readonly createBackToAdminOptionsButton: () => MessageButton;
  readonly showTicket: (reference: string) => void;
  readonly showLiveChatQueue: () => void;
  readonly customizeButtons: CustomizeAdminButtons;
}

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
