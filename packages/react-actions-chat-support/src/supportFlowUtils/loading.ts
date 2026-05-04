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
  let unsubscribeLoading: (() => void) | undefined;
  let didSetLoading = false;
  let loadingMutationId: number | undefined;
  let chatLifecycleId: number | undefined;

  /**
   * Clears a pending delayed loading timer before it can show the indicator.
   */
  const clearLoadingTimer = (): void => {
    if (loadingTimer === undefined) {
      return;
    }

    globalThis.clearTimeout(loadingTimer);
    loadingTimer = undefined;
  };

  /**
   * Marks support as the current loading owner when the indicator is hidden.
   */
  const claimLoading = (): void => {
    const chatStore = useChatStore.getState();

    if (chatStore.chatLifecycleId !== chatLifecycleId) {
      return;
    }

    if (chatStore.isLoading) {
      return;
    }

    chatStore.setLoading(true);
    didSetLoading = true;
    loadingMutationId = useChatStore.getState().loadingMutationId;
  };

  /**
   * Watches for other loading owners clearing the shared indicator too early.
   */
  const startWatchingLoading = (): void => {
    if (unsubscribeLoading !== undefined) {
      return;
    }

    unsubscribeLoading = useChatStore.subscribe(state => {
      if (state.chatLifecycleId !== chatLifecycleId) {
        stopWatchingLoading();
        return;
      }

      if (pendingOperations <= 0 || state.isLoading) {
        return;
      }

      claimLoading();
    });
  };

  /**
   * Stops watching shared loading state after support work has finished.
   */
  const stopWatchingLoading = (): void => {
    if (unsubscribeLoading === undefined) {
      return;
    }

    unsubscribeLoading();
    unsubscribeLoading = undefined;
  };

  /**
   * Starts delayed loading tracking for one support operation.
   */
  const startLoading = (): void => {
    if (pendingOperations === 0) {
      chatLifecycleId = useChatStore.getState().chatLifecycleId;
    }

    pendingOperations += 1;

    if (pendingOperations > 1 || loadingTimer !== undefined) {
      return;
    }

    loadingTimer = globalThis.setTimeout(() => {
      loadingTimer = undefined;
      if (useChatStore.getState().chatLifecycleId !== chatLifecycleId) {
        return;
      }
      startWatchingLoading();
      claimLoading();
    }, SUPPORT_LOADING_DELAY_MS);
  };

  /**
   * Finishes delayed loading tracking for one support operation.
   */
  const finishLoading = (): void => {
    pendingOperations = Math.max(0, pendingOperations - 1);

    if (pendingOperations > 0) {
      return;
    }

    clearLoadingTimer();
    stopWatchingLoading();
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
    chatLifecycleId = undefined;
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
