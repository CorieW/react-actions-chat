import type { MessageButton, MessageButtonVariant } from "../js/types";
import { useChatStore } from "../lib";

export interface RequestConfirmationButtonConfig {
  /**
   * Label for the initial button that triggers the confirmation flow.
   */
  readonly initialLabel: string;

  /**
   * Message displayed in the followup message when the initial button is clicked.
   */
  readonly confirmationMessage?: string | undefined;

  /**
   * Label for the confirm button. Defaults to "Confirm".
   */
  readonly confirmLabel?: string | undefined;

  /**
   * Label for the reject button. Defaults to "Decline".
   */
  readonly rejectLabel?: string | undefined;

  /**
   * Callback function executed when the user confirms.
   */
  readonly onConfirm: () => void;

  /**
   * Callback function executed when the user rejects.
   */
  readonly onReject: () => void;

  /**
   * Optional variant for the initial button. Defaults to 'default'.
   */
  readonly variant?: MessageButtonVariant | undefined;

  /**
   * Optional className for the initial button.
   */
  readonly className?: string | undefined;

  /**
   * Optional style for the initial button.
   */
  readonly style?: React.CSSProperties | undefined;
}

export interface RequestConfirmationButtonRuntimeConfig {
  /**
   * Optional persistent button id. When provided, createButton can return a
   * button that is safe to reuse in persistent button collections.
   */
  readonly id?: string | undefined;

  /**
   * Callback function executed when the user confirms.
   */
  readonly onConfirm?: (() => void) | undefined;

  /**
   * Callback function executed when the user rejects.
   */
  readonly onReject?: (() => void) | undefined;
}

/**
 * Static configuration for a confirmation request button before runtime
 * callbacks are attached by the app.
 */
export interface RequestConfirmationButtonDefinition
  extends Omit<RequestConfirmationButtonConfig, "onConfirm" | "onReject"> {
  readonly kind: "request-confirmation";
  readonly id?: string | undefined;

  /**
   * Optional success callback attached directly to the definition. This runs
   * when the confirmation is accepted through a button created from the
   * definition.
   */
  readonly onSuccess?: (() => void) | undefined;
}

/**
 * Creates a reusable definition for a confirmation request button. Apps can
 * pass this definition to createButton and provide runtime callbacks there.
 */
export function createRequestConfirmationButtonDef(
  definition: Omit<RequestConfirmationButtonDefinition, "kind">,
): RequestConfirmationButtonDefinition {
  return {
    ...definition,
    kind: "request-confirmation",
  };
}

/**
 * Creates a MessageButton configuration that implements a confirmation flow.
 *
 * When clicked, the initial button adds a followup message with confirmation buttons.
 * The user can then confirm or reject the action, triggering the respective callbacks.
 *
 * @param config Configuration options for the confirmation button
 * @returns A MessageButton configuration that can be used in a Message's buttons array
 */
export function createRequestConfirmationButton(
  config: RequestConfirmationButtonConfig,
): MessageButton {
  const {
    initialLabel,
    confirmationMessage,
    confirmLabel = "Confirm",
    rejectLabel = "Decline",
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
      const { addMessage } = useChatStore.getState();

      // Add a followup message with the confirmation message and buttons
      addMessage({
        type: "other",
        content: confirmationMessage ?? "Are you sure you want to do this?",
        buttons: [
          {
            label: confirmLabel,
            variant: "success",
            onClick: () => {
              onConfirm();
            },
          },
          {
            label: rejectLabel,
            variant: "dull",
            onClick: () => {
              if (onReject) {
                onReject();
              }
            },
          },
        ],
      });
    },
  };
}
