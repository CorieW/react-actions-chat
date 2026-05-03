import type { InputBarModeConfig } from '../../../js/types';
import type { useInputFieldStore } from '../../../lib/inputFieldStore';

/**
 * Resolved shared input field store state type.
 */
type InputFieldStoreState = ReturnType<typeof useInputFieldStore.getState>;

/**
 * Applies mode-related settings to the shared input bar.
 *
 * @param store Shared input field store state.
 * @param config Mode configuration to apply.
 */
export function configureInputBarMode(
  store: InputFieldStoreState,
  config: InputBarModeConfig
): void {
  store.setInputFieldParams({
    type: config.type,
    placeholder: config.placeholder ?? 'Type your message...',
    description: config.description ?? '',
    options: config.options ?? [],
  });
}

/**
 * Resets mode-related settings back to the default input bar state.
 *
 * @param store Shared input field store state.
 */
export function resetInputBarMode(store: InputFieldStoreState): void {
  store.resetInputFieldParams({
    type: true,
    placeholder: true,
    description: true,
    options: true,
  });
}
