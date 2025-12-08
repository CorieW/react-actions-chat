// Re-export React adapters as the default for this library
// Other frameworks can import from their specific adapter files
export {
  useChatStore,
  useInputFieldStore,
  usePersistentButtonStore,
  type ChatStore,
  type InputFieldStore,
  type PersistentButtonStore,
  type ChatStoreState,
  type ChatStoreActions,
  type InputFieldStoreState,
  type InputFieldStoreActions,
  type InputType,
  type InputValidator,
  type PersistentButtonStoreState,
  type PersistentButtonStoreActions,
  type PersistentButton,
} from './react';
