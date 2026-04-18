import type { InputBarValidationConfig } from '../../../js/types';
import type { useInputFieldStore } from '../../../lib/inputFieldStore';

type InputFieldStoreState = ReturnType<typeof useInputFieldStore.getState>;

/**
 * Applies validation settings to the shared input bar.
 *
 * @param store Shared input field store state.
 * @param config Validation configuration to apply.
 */
export function configureInputBarValidation(
  store: InputFieldStoreState,
  config: InputBarValidationConfig
): void {
  store.setInputFieldParams({
    validator: config.validator ?? null,
    submitGuard: config.submitGuard ?? null,
  });
}

/**
 * Resets validation settings back to the default input bar state.
 *
 * @param store Shared input field store state.
 */
export function resetInputBarValidation(store: InputFieldStoreState): void {
  store.resetInputFieldParams({
    validator: true,
    submitGuard: true,
  });
}
