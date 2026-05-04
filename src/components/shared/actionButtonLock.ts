import { useChatStore } from '../../lib';

/**
 * Minimum time in milliseconds that action buttons remain locked after a click.
 */
const ACTION_BUTTON_LOCK_MS = 250;

/**
 * Timer used to release the shared action-button lock.
 */
let actionButtonLockTimer: ReturnType<typeof globalThis.setTimeout> | undefined;

/**
 * Clears any pending action-button lock release timer.
 */
function clearActionButtonLockTimer(): void {
  if (actionButtonLockTimer === undefined) {
    return;
  }

  globalThis.clearTimeout(actionButtonLockTimer);
  actionButtonLockTimer = undefined;
}

/**
 * Returns whether a callback result can be awaited for lock release.
 *
 * @param value - Callback result to inspect.
 */
function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    'then' in value &&
    typeof value.then === 'function'
  );
}

/**
 * Schedules the temporary action-button lock to be released.
 */
function scheduleActionButtonUnlock(): void {
  clearActionButtonLockTimer();
  actionButtonLockTimer = globalThis.setTimeout(() => {
    actionButtonLockTimer = undefined;
    useChatStore.getState().unlockActions();
  }, ACTION_BUTTON_LOCK_MS);
}

/**
 * Runs an action button callback while immediately locking all action buttons.
 *
 * @param action - Action button callback to run.
 */
export function runWithActionButtonLock(
  action: (() => PromiseLike<unknown> | void | undefined) | undefined
): void {
  const chatStore = useChatStore.getState();

  if (chatStore.isActionLocked || chatStore.isLoading) {
    return;
  }

  chatStore.lockActions();
  clearActionButtonLockTimer();

  let result: PromiseLike<unknown> | void | undefined;

  try {
    result = action?.();
  } catch (error) {
    scheduleActionButtonUnlock();
    throw error;
  }

  if (isPromiseLike(result)) {
    void Promise.resolve(result).finally(() => {
      useChatStore.getState().unlockActions();
    });
    return;
  }

  scheduleActionButtonUnlock();
}
