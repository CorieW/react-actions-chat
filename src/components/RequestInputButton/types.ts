import type React from 'react';
import type { MessageButtonVariant } from '../../js/types';
import type { InputType, InputValidator } from '../../lib/inputFieldStore';

type MaybePromise<T> = T | Promise<T>;

/**
 * Limits how frequently the shared input can be submitted while an input
 * request flow is active.
 */
export interface RequestInputRateLimit {
  /**
   * Maximum number of messages allowed during the rolling window.
   */
  readonly maxMessages: number;

  /**
   * Rolling time window used to count recent submissions, in milliseconds.
   */
  readonly windowMs: number;

  /**
   * Optional maximum length for any single submitted message.
   */
  readonly maxMessageLength?: number | undefined;

  /**
   * Optional custom message shown when the submission count limit is reached.
   */
  readonly tooManyMessagesMessage?: string | undefined;

  /**
   * Optional custom message shown when a submitted message is too long.
   */
  readonly tooLongMessageMessage?: string | undefined;
}

/**
 * Configuration for a button that asks the user to submit a follow-up input.
 *
 * @property initialLabel Label for the initial button that triggers the input request flow.
 * @property inputPromptMessage Message displayed when requesting input from the user.
 * @property placeholder Placeholder text for the input field.
 * @property inputDescription Description text shown above the input field.
 * @property inputType Type of input field used for the request flow.
 * @property validator Validation function used to accept or reject submitted input.
 * @property minMessageLength Minimum trimmed message length required before a send is accepted.
 * @property minMessageLengthMessage Optional custom message shown when the input is too short.
 * @property cooldownMs Minimum wait time between accepted submissions while the flow is active.
 * @property cooldownMessage Optional custom message shown when the flow is cooling down.
 * @property inputTimeoutMs How long the flow should wait for input before timing out.
 * @property inputTimeoutMessage Optional custom message shown when the flow times out.
 * @property onInvalidInput Callback function executed when the user provides invalid input.
 * @property onValidInput Callback function executed when the user provides valid input.
 * @property suppressValidationFailureMessage When true, skips the default validation failure message.
 * @property variant Optional variant for the initial button.
 * @property className Optional className for the initial button.
 * @property style Optional style for the initial button.
 * @property abortLabel Custom label for the abort button.
 * @property abortCallback Custom callback function executed when the abort button is clicked.
 * @property showAbort Whether to show the abort button during the flow.
 * @property shouldWaitForTurn Whether the input should stay disabled until the async response finishes.
 * @property rateLimit Optional rolling limits for how often input can be submitted.
 */
export interface RequestInputButtonConfig {
  readonly initialLabel: string;
  readonly inputPromptMessage: string;
  readonly placeholder?: string | undefined;
  readonly inputDescription?: string | undefined;
  readonly inputType?: InputType | undefined;
  readonly validator?: InputValidator | undefined;
  readonly minMessageLength?: number | undefined;
  readonly minMessageLengthMessage?: string | undefined;
  readonly cooldownMs?: number | undefined;
  readonly cooldownMessage?: string | undefined;
  readonly inputTimeoutMs?: number | undefined;
  readonly inputTimeoutMessage?: string | undefined;
  readonly onInvalidInput?:
    | undefined
    | ((inputValue: string, errorMessage: string) => void);
  readonly onValidInput?:
    | undefined
    | ((inputValue: string) => MaybePromise<void>);
  readonly suppressValidationFailureMessage?: boolean | undefined;
  readonly variant?: MessageButtonVariant | undefined;
  readonly className?: string | undefined;
  readonly style?: React.CSSProperties | undefined;
  readonly abortLabel?: string | undefined;
  readonly abortCallback?: () => void | undefined;
  readonly showAbort?: boolean | undefined;
  readonly shouldWaitForTurn?: boolean | undefined;
  readonly rateLimit?: RequestInputRateLimit | undefined;
}

/**
 * Runtime overrides that can be added when building an input request button.
 *
 * @property id Optional persistent button id.
 * @property abortCallback Custom callback function executed when the abort button is clicked.
 * @property onInvalidInput Callback function executed when the user provides invalid input.
 * @property onValidInput Callback function executed when the user provides valid input.
 */
export interface RequestInputButtonRuntimeConfig {
  readonly id?: string | undefined;
  readonly abortCallback?: () => void | undefined;
  readonly onInvalidInput?:
    | undefined
    | ((inputValue: string, errorMessage: string) => void);
  readonly onValidInput?:
    | undefined
    | ((inputValue: string) => MaybePromise<void>);
}

/**
 * Static configuration for an input request button before runtime callbacks
 * are attached by the app.
 *
 * @property kind Discriminator used by createButton to detect this definition type.
 * @property id Optional id used when reusing the button in persistent button collections.
 * @property onSuccess Optional success callback attached directly to the definition.
 */
export interface RequestInputButtonDefinition extends Omit<
  RequestInputButtonConfig,
  'abortCallback' | 'onInvalidInput' | 'onValidInput'
> {
  readonly kind: 'request-input';
  readonly id?: string | undefined;
  readonly onSuccess?: undefined | ((inputValue: string) => MaybePromise<void>);
}
