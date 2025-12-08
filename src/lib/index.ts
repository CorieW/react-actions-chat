// React adapter exports (for React applications)
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
} from './adapters';

// Core store exports (for framework-agnostic or vanilla JS usage)
export {
  createChatStore,
  createInputFieldStore,
  createPersistentButtonStore,
  chatStore,
  inputFieldStore,
  persistentButtonStore,
} from './core';

// Theme exports
export {
  LIGHT_THEME,
  DARK_THEME,
  getResolvedTheme,
  getThemeStyles,
} from './themes';

// Utility exports
export { cn } from './utils';
