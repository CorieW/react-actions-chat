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
  return `support-live-chat-end-${sessionId}`;
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
  readonly labels: SupportUserFlowLabels;
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
 * Shared dependencies used while building user live chat button.
 */
interface UserLiveChatButtonEnvironment {
  /**
   * Customer identity associated with the flow or record.
   */
  readonly customer: SupportUserIdentity;
  /**
   * Resolved labels used by this flow or helper.
   */
  readonly labels: SupportUserFlowLabels;
  /**
   * Shared context passed to formatter functions.
   */
  readonly formatterContext: SupportUserFormatterContext;
  /**
   * Request-input override settings used by the flow.
   */
  readonly requestInputs: SupportUserFlowConfig['requestInputs'];
  /**
   * Validation settings for initial live-chat messages.
   */
  readonly liveChatInitialMessageValidation: SupportInputValidationSettings;
  /**
   * Service used to start a live-chat session.
   */
  readonly startLiveChat: SupportUserFlowServices['startLiveChat'];
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
   * Renders a live chat session into the transcript.
   *
   * @param session - Live chat session to inspect or render.
   */
  readonly renderLiveChatSession: (session: SupportLiveChatSession) => void;
  /**
   * Handler used to redirect the customer to an existing open live chat.
   */
  readonly redirectToOpenLiveChat: () => Promise<boolean>;
}

/**
 * Creates a customer start-live-chat request button.
 *
 * @param options - Options for creating the customer start-live-chat request button.
 */
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

/**
 * Creates a customer live chat button.
 *
 * @param environment - Live-chat button dependencies and callbacks.
 */
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
