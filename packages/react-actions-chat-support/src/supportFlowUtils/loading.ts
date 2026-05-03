import { useChatStore } from 'react-actions-chat';

/**
 * Delay before support async operations show the shared chat loading indicator.
 */
const SUPPORT_LOADING_DELAY_MS = 150;

/**
 * Runs async support work while coordinating the shared chat loading indicator.
 */
interface SupportLoadingController {
  /**
   * Runs an async operation and shows loading when it remains pending past the delay.
   *
   * @param operation - Async support operation to run.
   */
  readonly runWithLoading: <TResult>(
    operation: () => Promise<TResult>
  ) => Promise<TResult>;
}

/**
 * Creates a loading controller for one support flow instance.
 */
export function createSupportLoadingController(): SupportLoadingController {
  let pendingOperations = 0;
  let loadingTimer: ReturnType<typeof setTimeout> | undefined;
  let didSetLoading = false;
  let loadingMutationId: number | undefined;

  const clearLoadingTimer = (): void => {
    if (loadingTimer === undefined) {
      return;
    }

    globalThis.clearTimeout(loadingTimer);
    loadingTimer = undefined;
  };

  const startLoading = (): void => {
    pendingOperations += 1;

    if (pendingOperations > 1 || loadingTimer !== undefined) {
      return;
    }

    loadingTimer = globalThis.setTimeout(() => {
      loadingTimer = undefined;
      const chatStore = useChatStore.getState();

      if (!chatStore.isLoading) {
        chatStore.setLoading(true);
        didSetLoading = true;
        loadingMutationId = useChatStore.getState().loadingMutationId;
      }
    }, SUPPORT_LOADING_DELAY_MS);
  };

  const finishLoading = (): void => {
    pendingOperations = Math.max(0, pendingOperations - 1);

    if (pendingOperations > 0) {
      return;
    }

    clearLoadingTimer();
    if (didSetLoading) {
      const chatStore = useChatStore.getState();

      didSetLoading = false;
      if (
        chatStore.isLoading &&
        chatStore.loadingMutationId === loadingMutationId
      ) {
        chatStore.clearLoading();
      }
      loadingMutationId = undefined;
    }
  };

  return {
    runWithLoading: async operation => {
      startLoading();

      try {
        return await operation();
      } finally {
        finishLoading();
      }
    },
  };
}
