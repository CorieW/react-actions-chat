import type React from 'react';
import type { MessageButtonVariant } from '../../js/types';
import type {
  InputFileValidator,
  InputSelectOption,
  InputSubmission,
  InputType,
  InputValidator,
} from '../../lib/inputFieldStore';

/**
 * Value that may be returned synchronously or through a promise.
 */
type MaybePromise<T> = T | Promise<T>;

/**
 * Callback invoked when a request-input flow rejects a submission.
 *
 * @param inputValue - Submitted input value being validated or handled.
 * @param errorMessage - Validation error message produced for the submission.
 * @param submission - Full input submission, including text and files.
 */
type RequestInputInvalidCallback = (
  inputValue: string,
  errorMessage: string,
  submission: InputSubmission
) => void;

/**
 * Callback invoked when a request-input flow accepts a submission.
 *
 * @param inputValue - Submitted input value being validated or handled.
 * @param submission - Full input submission, including text and files.
 */
type RequestInputValidCallback = (
  inputValue: string,
  submission: InputSubmission
) => MaybePromise<void>;

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
 * @property inputOptions Options shown when inputType is select.
 * @property allowFileUpload Whether the shared input should expose the upload button during the flow.
 * @property fileValidator Validation function used to accept or reject uploaded files.
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
  /**
   * Label shown for the initial action.
   */
  readonly initialLabel: string;
  /**
   * Prompt message shown before collecting request input.
   */
  readonly inputPromptMessage: string;
  /**
   * Placeholder text shown by the input.
   */
  readonly placeholder?: string | undefined;
  /**
   * Description shown alongside the request input.
   */
  readonly inputDescription?: string | undefined;
  /**
   * Input mode used when collecting user input.
   */
  readonly inputType?: InputType | undefined;
  /**
   * Select options shown by the request input.
   */
  readonly inputOptions?: readonly InputSelectOption[] | undefined;
  /**
   * Whether file uploads are allowed for the input.
   */
  readonly allowFileUpload?: boolean | undefined;
  /**
   * Validator applied to uploaded files.
   */
  readonly fileValidator?: InputFileValidator | undefined;
  /**
   * Validator applied to text submissions.
   */
  readonly validator?: InputValidator | undefined;
  /**
   * Minimum number of characters required for submission.
   */
  readonly minMessageLength?: number | undefined;
  /**
   * Validation message shown when the submission is too short.
   */
  readonly minMessageLengthMessage?: string | undefined;
  /**
   * Cooldown duration in milliseconds before another submission is allowed.
   */
  readonly cooldownMs?: number | undefined;
  /**
   * Message shown while the input is in cooldown.
   */
  readonly cooldownMessage?: string | undefined;
  /**
   * Timeout in milliseconds before the request input expires.
   */
  readonly inputTimeoutMs?: number | undefined;
  /**
   * Message shown when the input times out.
   */
  readonly inputTimeoutMessage?: string | undefined;
  /**
   * Callback invoked when submitted input fails validation.
   */
  readonly onInvalidInput?: RequestInputInvalidCallback | undefined;
  /**
   * Callback invoked when submitted input passes validation.
   */
  readonly onValidInput?: RequestInputValidCallback | undefined;
  /**
   * Whether validation failure messages are suppressed.
   */
  readonly suppressValidationFailureMessage?: boolean | undefined;
  /**
   * Visual variant used when rendering the button.
   */
  readonly variant?: MessageButtonVariant | undefined;
  /**
   * Additional class name applied to the rendered element.
   */
  readonly className?: string | undefined;
  /**
   * Inline styles applied to the rendered element.
   */
  readonly style?: React.CSSProperties | undefined;
  /**
   * Label shown for the abort action.
   */
  readonly abortLabel?: string | undefined;
  /**
   * Callback invoked when the request-input flow is aborted.
   */
  readonly abortCallback?: () => void | undefined;
  /**
   * Whether the abort action is shown while collecting input.
   */
  readonly showAbort?: boolean | undefined;
  /**
   * Whether submissions wait for the current assistant turn to finish.
   */
  readonly shouldWaitForTurn?: boolean | undefined;
  /**
   * Rate-limit settings applied to request-input submissions.
   */
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
  /**
   * Stable identifier for this value.
   */
  readonly id?: string | undefined;
  /**
   * Callback invoked when the request-input flow is aborted.
   */
  readonly abortCallback?: () => void | undefined;
  /**
   * Callback invoked when submitted input fails validation.
   */
  readonly onInvalidInput?: RequestInputInvalidCallback | undefined;
  /**
   * Callback invoked when submitted input passes validation.
   */
  readonly onValidInput?: RequestInputValidCallback | undefined;
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
  /**
   * Discriminant describing which branch of the contract is active.
   */
  readonly kind: 'request-input';
  /**
   * Stable identifier for this value.
   */
  readonly id?: string | undefined;
  /**
   * Callback invoked after the operation completes successfully.
   */
  readonly onSuccess?: RequestInputValidCallback | undefined;
}
