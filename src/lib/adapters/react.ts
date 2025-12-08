import { useStore } from 'zustand';
import {
  chatStore,
  inputFieldStore,
  persistentButtonStore,
  type ChatStore,
  type InputFieldStore,
  type PersistentButtonStore,
} from '../core';

/**
 * Interface for React store hooks that also expose getState for non-reactive access.
 */
interface ReactStoreHook<T> {
  (): T;
  <U>(selector: (state: T) => U): U;
  /** Get the current state without subscribing to updates (for use outside React components) */
  getState: () => T;
}

/**
 * React hook for accessing the chat store.
 * Provides reactive access to chat state and actions.
 *
 * @example
 * ```tsx
 * // In a React component (reactive)
 * const { messages, addMessage } = useChatStore();
 *
 * // Outside React (non-reactive)
 * const { addMessage } = useChatStore.getState();
 * ```
 */
function useChatStoreImpl(): ChatStore;
function useChatStoreImpl<T>(selector: (state: ChatStore) => T): T;
function useChatStoreImpl<T>(
  selector?: (state: ChatStore) => T
): T | ChatStore {
  return useStore(chatStore, selector as (state: ChatStore) => T);
}

export const useChatStore: ReactStoreHook<ChatStore> = Object.assign(
  useChatStoreImpl,
  { getState: () => chatStore.getState() }
);

/**
 * React hook for accessing the input field store.
 * Provides reactive access to input field state and actions.
 *
 * @example
 * ```tsx
 * // In a React component (reactive)
 * const { inputFieldType, setInputFieldType } = useInputFieldStore();
 *
 * // Outside React (non-reactive)
 * const { setInputFieldType } = useInputFieldStore.getState();
 * ```
 */
function useInputFieldStoreImpl(): InputFieldStore;
function useInputFieldStoreImpl<T>(selector: (state: InputFieldStore) => T): T;
function useInputFieldStoreImpl<T>(
  selector?: (state: InputFieldStore) => T
): T | InputFieldStore {
  return useStore(inputFieldStore, selector as (state: InputFieldStore) => T);
}

export const useInputFieldStore: ReactStoreHook<InputFieldStore> =
  Object.assign(useInputFieldStoreImpl, {
    getState: () => inputFieldStore.getState(),
  });

/**
 * React hook for accessing the persistent button store.
 * Provides reactive access to persistent button state and actions.
 *
 * @example
 * ```tsx
 * // In a React component (reactive)
 * const { buttons, addButton } = usePersistentButtonStore();
 *
 * // Outside React (non-reactive)
 * const { addButton } = usePersistentButtonStore.getState();
 * ```
 */
function usePersistentButtonStoreImpl(): PersistentButtonStore;
function usePersistentButtonStoreImpl<T>(
  selector: (state: PersistentButtonStore) => T
): T;
function usePersistentButtonStoreImpl<T>(
  selector?: (state: PersistentButtonStore) => T
): T | PersistentButtonStore {
  return useStore(
    persistentButtonStore,
    selector as (state: PersistentButtonStore) => T
  );
}

export const usePersistentButtonStore: ReactStoreHook<PersistentButtonStore> =
  Object.assign(usePersistentButtonStoreImpl, {
    getState: () => persistentButtonStore.getState(),
  });

// Re-export core types for convenience
export type { ChatStore, InputFieldStore, PersistentButtonStore };

// Re-export additional types from core
export type {
  ChatStoreState,
  ChatStoreActions,
  InputFieldStoreState,
  InputFieldStoreActions,
  InputType,
  InputValidator,
  PersistentButtonStoreState,
  PersistentButtonStoreActions,
  PersistentButton,
} from '../core';
