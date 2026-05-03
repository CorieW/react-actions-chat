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

/**
 * Button customization hook scoped to customer flow internals.
 *
 * @param context - Context object available to this resolver.
 */
type CustomizeUserButtons = (
  context: Omit<SupportUserFlowButtonContext, 'customer'>
) => readonly MessageButton[];

/**
 * Options used to create user live chat flow.
 */
interface CreateUserLiveChatFlowOptions {
  /**
   * Flow or component configuration for this contract.
   */
  readonly config: SupportUserFlowConfig;
  /**
   * Customer identity associated with the flow or record.
   */
  readonly customer: SupportUserIdentity;
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportUserFlowLabels;
  /**
   * Input behavior settings applied by the flow.
   */
  readonly behavior: NonNullable<SupportUserFlowConfig['behavior']>;
  /**
   * Shared context passed to formatter functions.
   */
  readonly formatterContext: SupportUserFormatterContext;
  /**
   * Validation settings for initial live-chat messages.
   */
  readonly liveChatInitialMessageValidation: SupportInputValidationSettings;
  /**
   * Validation settings for live-chat messages.
   */
  readonly liveChatMessageValidation: SupportInputValidationSettings;
  /**
   * Whether individual live-chat lookup is available.
   */
  readonly canGetLiveChat: boolean;
  /**
   * Service used to start a live-chat session.
   */
  readonly startLiveChat: SupportUserFlowServices['startLiveChat'];
  /**
   * Service used to update a live-chat session.
   */
  readonly updateLiveChat: SupportUserFlowServices['updateLiveChat'];
  /**
   * Service used to append a message to a live-chat session.
   */
  readonly appendLiveChatMessage: SupportUserFlowServices['appendLiveChatMessage'];
  /**
   * Service used to retrieve a live-chat session.
   */
  readonly getLiveChat: SupportUserFlowServices['getLiveChat'];
  /**
   * Service used to retrieve the customer's open live-chat session.
   */
  readonly getOpenLiveChat: SupportUserFlowServices['getOpenLiveChat'];
  /**
   * Formats user live chat details.
   *
   * @param session - Live chat session to inspect or render.
   */
  readonly formatUserLiveChatDetails: (
    session: SupportLiveChatSession
  ) => string;
  /**
   * Formats user live chat ended.
   *
   * @param session - Live chat session to inspect or render.
   */
  readonly formatUserLiveChatEnded: (session: SupportLiveChatSession) => string;
  /**
   * Adds a support markdown message to the transcript.
   *
   * @param markdown - Markdown message body to add.
   * @param buttons - Buttons to render, store, or customize.
   * @param userResponseCallback - Callback invoked with the submitted user response.
   */
  readonly addSupportMessage: (
    markdown: string,
    buttons: readonly MessageButton[],
    userResponseCallback?: (submission?: InputSubmission) => void
  ) => void;
  /**
   * Adds a recovery message after a request-input flow is aborted.
   *
   * @param markdown - Markdown message body to add.
   * @param buttons - Buttons to render, store, or customize.
   */
  readonly addAbortRecoveryMessage: (
    markdown: string,
    buttons: readonly MessageButton[]
  ) => void;
  /**
   * Factory used to create the primary flow action buttons.
   */
  readonly createPrimaryButtons: () => readonly MessageButton[];
  /**
   * Creates a button that refreshes a live chat session.
   *
   * @param sessionId - Live chat session ID to look up.
   */
  readonly createRefreshLiveChatButton: (sessionId: string) => MessageButton;
  /**
   * Hook used to customize customer live-chat buttons before rendering.
   */
  readonly customizeButtons: CustomizeUserButtons;
}

/**
 * Runtime API returned by the user live chat factory.
 */
export interface UserLiveChatFlow {
  /**
   * Factory used to create the live-chat action button.
   */
  readonly createLiveChatButton: () => MessageButton;
  /**
   * Handler used to redirect the customer to an existing open live chat.
   */
  readonly redirectToOpenLiveChat: () => Promise<boolean>;
  /**
   * Renders a live chat session into the transcript.
   *
   * @param session - Live chat session to inspect or render.
   */
  readonly renderLiveChatSession: (session: SupportLiveChatSession) => void;
  /**
   * Shows a customer live chat session.
   *
   * @param sessionId - Live chat session ID to look up.
   */
  readonly showLiveChatSession: (sessionId: string) => Promise<void>;
}

/**
 * Runtime API returned by the customer live chat workflow factory.
 *
 * @param options - Options for creating the user live chat flow.
 */
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
