import { createButton, type MessageButton } from 'react-actions-chat';
import type {
  SupportInputValidationSettings,
  SupportLiveChatSession,
  SupportUserIdentity,
} from '../../supportFlowTypes';
import type { SupportUserFlowServices } from '../services';
import type {
  SupportUserFlowConfig,
  SupportUserFlowLabels,
  SupportUserFormatterContext,
} from '../types';
import { createStartLiveChatButtonDef } from './buttonDefs';

type PersistentButtonCandidate = MessageButton & {
  readonly id?: string | undefined;
};

function getLiveChatEndButtonId(sessionId: string): string {
  return `support-live-chat-end-${sessionId}`;
}

interface CreateLiveChatPersistentDefaultButtonsOptions {
  readonly session: SupportLiveChatSession;
  readonly labels: SupportUserFlowLabels;
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

interface UserLiveChatButtonEnvironment {
  readonly customer: SupportUserIdentity;
  readonly labels: SupportUserFlowLabels;
  readonly formatterContext: SupportUserFormatterContext;
  readonly requestInputs: SupportUserFlowConfig['requestInputs'];
  readonly liveChatInitialMessageValidation: SupportInputValidationSettings;
  readonly startLiveChat: SupportUserFlowServices['startLiveChat'];
  readonly addAbortRecoveryMessage: (
    markdown: string,
    buttons: readonly MessageButton[]
  ) => void;
  readonly createPrimaryButtons: () => readonly MessageButton[];
  readonly renderLiveChatSession: (session: SupportLiveChatSession) => void;
  readonly redirectToOpenLiveChat: () => Promise<boolean>;
}

function createUserStartLiveChatRequestButton({
  customer,
  labels,
  requestInputs,
  liveChatInitialMessageValidation,
  startLiveChat,
  addAbortRecoveryMessage,
  createPrimaryButtons,
  renderLiveChatSession,
}: UserLiveChatButtonEnvironment): MessageButton {
  const inputContext = {
    customer,
  };

  return createButton(
    createStartLiveChatButtonDef({
      labels,
      validation: liveChatInitialMessageValidation,
      inputOverrides: requestInputs?.startLiveChat,
      inputContext,
    }),
    {
      onValidInput: async summary => {
        const session = await startLiveChat({
          summary,
          requestedBy: 'customer',
          customer,
        });

        renderLiveChatSession(session);
      },
      abortCallback: () => {
        addAbortRecoveryMessage(
          'Live chat request cancelled. You can start a ticket or try live chat again when you are ready.',
          createPrimaryButtons()
        );
      },
    }
  );
}

export function createUserLiveChatButton(
  environment: UserLiveChatButtonEnvironment
): MessageButton {
  return createButton({
    label: environment.labels.startLiveChat,
    onClick: () => {
      void (async () => {
        const didRedirect = await environment.redirectToOpenLiveChat();

        if (!didRedirect) {
          createUserStartLiveChatRequestButton(environment).onClick?.();
        }
      })();
    },
  });
}
