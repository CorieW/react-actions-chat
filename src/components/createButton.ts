import type { MessageButton } from '../js/types';
import {
  createRequestConfirmationButton,
  type RequestConfirmationButtonConfig,
  type RequestConfirmationButtonDefinition,
  type RequestConfirmationButtonRuntimeConfig,
} from './RequestConfirmationButton';
import {
  createRequestInputButton,
  type RequestInputButtonConfig,
  type RequestInputButtonDefinition,
  type RequestInputButtonRuntimeConfig,
} from './RequestInputButton';

/**
 * Base configuration for a plain message button definition.
 *
 * @property id Optional id used when reusing the button in persistent button collections.
 */
export interface ButtonDefinition extends Omit<MessageButton, 'onClick'> {
  readonly id?: string | undefined;
}

/**
 * Runtime overrides that can be applied when creating a plain message button.
 *
 * @property id Optional id that overrides the definition id when the button is created.
 * @property onClick Click handler attached to the created button at runtime.
 */
export interface ButtonRuntimeConfig {
  readonly id?: string | undefined;
  readonly onClick?: (() => void) | undefined;
}

/**
 * Union of all button definition shapes supported by createButton.
 */
export type AnyButtonDefinition =
  | ButtonDefinition
  | RequestInputButtonDefinition
  | RequestConfirmationButtonDefinition;

/**
 * Final button shape returned by createButton.
 *
 * @property id Optional id used when storing the button in persistent button collections.
 */
export type CreatedButton = MessageButton & {
  readonly id?: string | undefined;
};

function withOptionalId(
  button: MessageButton,
  id: string | undefined
): CreatedButton {
  if (!id) {
    return button;
  }

  return {
    ...button,
    id,
  };
}

function isRequestInputButtonDefinition(
  definition: AnyButtonDefinition
): definition is RequestInputButtonDefinition {
  return 'kind' in definition && definition.kind === 'request-input';
}

function isRequestConfirmationButtonDefinition(
  definition: AnyButtonDefinition
): definition is RequestConfirmationButtonDefinition {
  return 'kind' in definition && definition.kind === 'request-confirmation';
}

/**
 * Creates a plain, input-request, or confirmation button from a shared API.
 *
 * @param definition The button definition to turn into a clickable message button.
 * @param runtimeConfig Optional runtime overrides applied when the button is created.
 */
export function createButton(
  definition: ButtonDefinition,
  runtimeConfig?: ButtonRuntimeConfig
): CreatedButton;
export function createButton(
  definition: RequestInputButtonDefinition,
  runtimeConfig?: RequestInputButtonRuntimeConfig
): CreatedButton;
export function createButton(
  definition: RequestConfirmationButtonDefinition,
  runtimeConfig?: RequestConfirmationButtonRuntimeConfig
): CreatedButton;
/**
 * Creates a plain, input-request, or confirmation button from a shared API.
 *
 * @param definition The button definition to turn into a clickable message button.
 * @param runtimeConfig Optional runtime overrides applied when the button is created.
 */
export function createButton(
  definition: AnyButtonDefinition,
  runtimeConfig:
    | ButtonRuntimeConfig
    | RequestInputButtonRuntimeConfig
    | RequestConfirmationButtonRuntimeConfig = {}
): CreatedButton {
  const id = runtimeConfig.id ?? definition.id;

  if (isRequestInputButtonDefinition(definition)) {
    const {
      id: _definitionId,
      kind: _kind,
      onSuccess,
      ...restDefinition
    } = definition;
    const { id: _runtimeId, ...restRuntime } =
      runtimeConfig as RequestInputButtonRuntimeConfig;
    const handleValidInput = (inputValue: string): void => {
      onSuccess?.(inputValue);
      restRuntime.onValidInput?.(inputValue);
    };
    const buttonConfig: RequestInputButtonConfig = {
      ...restDefinition,
      ...restRuntime,
      ...(onSuccess || restRuntime.onValidInput
        ? { onValidInput: handleValidInput }
        : {}),
    };

    return withOptionalId(createRequestInputButton(buttonConfig), id);
  }

  if (isRequestConfirmationButtonDefinition(definition)) {
    const {
      id: _definitionId,
      kind: _kind,
      onSuccess,
      ...restDefinition
    } = definition;
    const { id: _runtimeId, ...restRuntime } =
      runtimeConfig as RequestConfirmationButtonRuntimeConfig;
    const handleConfirm = (): void => {
      onSuccess?.();
      restRuntime.onConfirm?.();
    };
    const buttonConfig: RequestConfirmationButtonConfig = {
      ...restDefinition,
      ...restRuntime,
      onConfirm: handleConfirm,
      onReject: restRuntime.onReject ?? (() => {}),
    };

    return withOptionalId(createRequestConfirmationButton(buttonConfig), id);
  }

  const { id: _definitionId, ...restDefinition } = definition;
  const { id: _runtimeId, onClick } = runtimeConfig as ButtonRuntimeConfig;
  const button: MessageButton = {
    ...restDefinition,
    ...(onClick ? { onClick } : {}),
  };

  return withOptionalId(button, id);
}
