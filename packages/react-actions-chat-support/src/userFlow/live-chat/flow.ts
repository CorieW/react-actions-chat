import {
  type InputSubmission,
  type MessageButton,
  useInputFieldStore,
  usePersistentButtonStore,
} from 'react-actions-chat';
import type {
  SupportInputValidationSettings,
  SupportLiveChatSession,
  SupportUserIdentity,
} from '../../supportFlowTypes';
import {
  deriveCustomerLabel,
  validateSupportInput,
  withPersistentButtonIds,
} from '../../supportFlowUtils';
import {
  createLiveChatPersistentDefaultButtons,
  createUserLiveChatButton,
} from './buttons';
import type { SupportUserFlowServices } from '../services';
import type {
  SupportUserFlowButtonContext,
  SupportUserFlowConfig,
  SupportUserFlowLabels,
  SupportUserFormatterContext,
  SupportUserLiveChatPersistentButtonContext,
} from '../types';

type CustomizeUserButtons = (
  context: Omit<SupportUserFlowButtonContext, 'customer'>
) => readonly MessageButton[];

interface CreateUserLiveChatFlowOptions {
  readonly config: SupportUserFlowConfig;
  readonly customer: SupportUserIdentity;
  readonly labels: SupportUserFlowLabels;
  readonly behavior: NonNullable<SupportUserFlowConfig['behavior']>;
  readonly formatterContext: SupportUserFormatterContext;
  readonly liveChatInitialMessageValidation: SupportInputValidationSettings;
  readonly liveChatMessageValidation: SupportInputValidationSettings;
  readonly canGetLiveChat: boolean;
  readonly startLiveChat: SupportUserFlowServices['startLiveChat'];
  readonly updateLiveChat: SupportUserFlowServices['updateLiveChat'];
  readonly appendLiveChatMessage: SupportUserFlowServices['appendLiveChatMessage'];
  readonly getLiveChat: SupportUserFlowServices['getLiveChat'];
  readonly getOpenLiveChat: SupportUserFlowServices['getOpenLiveChat'];
  readonly formatUserLiveChatDetails: (
    session: SupportLiveChatSession
  ) => string;
  readonly formatUserLiveChatEnded: (session: SupportLiveChatSession) => string;
  readonly addSupportMessage: (
    markdown: string,
    buttons: readonly MessageButton[],
    userResponseCallback?: (submission?: InputSubmission) => void
  ) => void;
  readonly addAbortRecoveryMessage: (
    markdown: string,
    buttons: readonly MessageButton[]
  ) => void;
  readonly createPrimaryButtons: () => readonly MessageButton[];
  readonly createRefreshLiveChatButton: (sessionId: string) => MessageButton;
  readonly customizeButtons: CustomizeUserButtons;
}

export interface UserLiveChatFlow {
  readonly createLiveChatButton: () => MessageButton;
  readonly redirectToOpenLiveChat: () => Promise<boolean>;
  readonly renderLiveChatSession: (session: SupportLiveChatSession) => void;
  readonly showLiveChatSession: (sessionId: string) => Promise<void>;
}

export function createUserLiveChatFlow({
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
}: CreateUserLiveChatFlowOptions): UserLiveChatFlow {
  const liveChatPersistentButtonIds = new Map<string, readonly string[]>();

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

  const createLiveChatButton = (): MessageButton => {
    return createUserLiveChatButton({
      customer,
      labels,
      formatterContext,
      requestInputs: config.requestInputs,
      liveChatInitialMessageValidation,
      startLiveChat,
      addAbortRecoveryMessage,
      createPrimaryButtons,
      renderLiveChatSession,
      redirectToOpenLiveChat,
    });
  };

  return {
    createLiveChatButton,
    redirectToOpenLiveChat,
    renderLiveChatSession,
    showLiveChatSession,
  };
}
