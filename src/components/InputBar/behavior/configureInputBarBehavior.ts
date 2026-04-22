import type { InputBarBehaviorConfig } from '../../../js/types';
import type { useInputFieldStore } from '../../../lib/inputFieldStore';

type InputFieldStoreState = ReturnType<typeof useInputFieldStore.getState>;

/**
 * Applies behavior settings to the shared input bar.
 *
 * @param store Shared input field store state.
 * @param config Behavior configuration to apply.
 */
export function configureInputBarBehavior(
  store: InputFieldStoreState,
  config: InputBarBehaviorConfig
): void {
  store.setInputFieldParams({
    ...(config.allowFileUpload !== undefined
      ? { fileUploadEnabled: config.allowFileUpload }
      : {}),
    ...(config.disabledPlaceholder !== undefined
      ? { disabledPlaceholder: config.disabledPlaceholder }
      : {}),
    disabled: config.disabled ?? false,
  });
}

/**
 * Resets behavior settings back to the default input bar state.
 *
 * @param store Shared input field store state.
 */
export function resetInputBarBehavior(store: InputFieldStoreState): void {
  store.resetInputFieldParams({
    fileUploadEnabled: true,
    disabled: true,
  });
}
