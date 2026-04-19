import {
  createTextPart,
  type MessageButton,
  type MessageButtonVariant,
} from '../js/types';
import { useChatStore } from '../lib';

/**
 * Configuration for a button that asks the user to confirm or decline an action.
 *
 * @property initialLabel Label for the initial button that triggers the confirmation flow.
 * @property confirmationMessage Message displayed in the followup message when the initial button is clicked.
 * @property confirmLabel Label for the confirm button.
 * @property rejectLabel Label for the reject button.
 * @property onConfirm Callback function executed when the user confirms.
 * @property onReject Callback function executed when the user rejects.
 * @property variant Optional variant for the initial button.
 * @property className Optional className for the initial button.
 * @property style Optional style for the initial button.
 */
export interface RequestConfirmationButtonConfig {
  readonly initialLabel: string;
  readonly confirmationMessage?: string | undefined;
  readonly confirmLabel?: string | undefined;
  readonly rejectLabel?: string | undefined;
  readonly onConfirm: () => void;
  readonly onReject: () => void;
  readonly variant?: MessageButtonVariant | undefined;
  readonly className?: string | undefined;
  readonly style?: React.CSSProperties | undefined;
}

/**
 * Runtime overrides that can be added when building a confirmation button.
 *
 * @property id Optional persistent button id.
 * @property onConfirm Callback function executed when the user confirms.
 * @property onReject Callback function executed when the user rejects.
 */
export interface RequestConfirmationButtonRuntimeConfig {
  readonly id?: string | undefined;
  readonly onConfirm?: (() => void) | undefined;
  readonly onReject?: (() => void) | undefined;
}

/**
 * Static configuration for a confirmation request button before runtime
 * callbacks are attached by the app.
 *
 * @property kind Discriminator used by createButton to detect this definition type.
 * @property id Optional id used when reusing the button in persistent button collections.
 * @property onSuccess Optional success callback attached directly to the definition.
 */
export interface RequestConfirmationButtonDefinition extends Omit<
  RequestConfirmationButtonConfig,
  'onConfirm' | 'onReject'
> {
  readonly kind: 'request-confirmation';
  readonly id?: string | undefined;
  readonly onSuccess?: (() => void) | undefined;
}

/**
 * Creates a reusable definition for a confirmation request button. Apps can
 * pass this definition to createButton and provide runtime callbacks there.
 *
 * @param definition The `Omit<RequestConfirmationButtonDefinition, 'kind'>` object.
 */
export function createRequestConfirmationButtonDef(
  definition: Omit<RequestConfirmationButtonDefinition, 'kind'>
): RequestConfirmationButtonDefinition {
  return {
    ...definition,
    kind: 'request-confirmation',
  };
}

/**
 * Creates a MessageButton configuration that implements a confirmation flow.
 *
 * When clicked, the initial button adds a followup message with confirmation buttons.
 * The user can then confirm or reject the action, triggering the respective callbacks.
 *
 * @param config The `RequestConfirmationButtonConfig` object.
 * @returns A MessageButton configuration that can be used in a Message's buttons array.
 */
export function createRequestConfirmationButton(
  config: RequestConfirmationButtonConfig
): MessageButton {
  const {
    initialLabel,
    confirmationMessage,
    confirmLabel = 'Confirm',
    rejectLabel = 'Decline',
    onConfirm,
    onReject,
    variant,
    className,
    style,
  } = config;

  return {
    label: initialLabel,
    variant: variant,
    className,
    style,
    onClick: () => {
      const { addMessage, clearPreviousMessageButtons } =
        useChatStore.getState();

      const runConfirmationAction = (callback: () => void): void => {
        clearPreviousMessageButtons();
        callback();
      };

      // Add a followup message with the confirmation message and buttons
      addMessage({
        type: 'other',
        parts: [
          createTextPart(
            confirmationMessage ?? 'Are you sure you want to do this?'
          ),
        ],
        buttons: [
          {
            label: confirmLabel,
            variant: 'success',
            blocksInputWhileVisible: true,
            onClick: () => {
              runConfirmationAction(onConfirm);
            },
          },
          {
            label: rejectLabel,
            variant: 'dull',
            blocksInputWhileVisible: true,
            onClick: () => {
              runConfirmationAction(onReject);
            },
          },
        ],
      });
    },
  };
}
