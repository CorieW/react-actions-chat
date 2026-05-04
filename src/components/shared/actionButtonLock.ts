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
 * Monotonic identifier assigned to every action-button lock owner.
 */
let actionButtonLockId = 0;

/**
 * Identifier for the callback that currently owns the shared lock.
 */
let activeActionButtonLockId: number | undefined;

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
 * Returns the current timestamp used to measure the minimum lock duration.
 */
function getActionButtonLockTimestamp(): number {
  return Date.now();
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
 * Releases the action-button lock when the calling owner still owns it.
 *
 * @param lockId - Identifier for the action callback releasing the lock.
 */
function unlockActionButtonLock(lockId: number): void {
  if (activeActionButtonLockId !== lockId) {
    return;
  }

  activeActionButtonLockId = undefined;
  useChatStore.getState().unlockActions();
}

/**
 * Schedules the temporary action-button lock to be released.
 *
 * @param lockId - Identifier for the action callback that owns the lock.
 * @param delayMs - Milliseconds to wait before releasing the lock.
 */
function scheduleActionButtonUnlock(
  lockId: number,
  delayMs = ACTION_BUTTON_LOCK_MS
): void {
  if (activeActionButtonLockId !== lockId) {
    return;
  }

  clearActionButtonLockTimer();
  actionButtonLockTimer = globalThis.setTimeout(() => {
    actionButtonLockTimer = undefined;
    unlockActionButtonLock(lockId);
  }, delayMs);
}

/**
 * Releases the lock after the action has run for at least the minimum duration.
 *
 * @param lockId - Identifier for the action callback that owns the lock.
 * @param lockedAt - Timestamp captured when the lock began.
 */
function releaseActionButtonLockAfterMinimumDelay(
  lockId: number,
  lockedAt: number
): void {
  if (activeActionButtonLockId !== lockId) {
    return;
  }

  const elapsedMs = getActionButtonLockTimestamp() - lockedAt;
  const remainingMs = ACTION_BUTTON_LOCK_MS - elapsedMs;

  if (remainingMs <= 0) {
    unlockActionButtonLock(lockId);
    return;
  }

  scheduleActionButtonUnlock(lockId, remainingMs);
}

/**
 * Runs an action button callback while immediately locking all action buttons.
 *
 * @param action - Action button callback to run.
 */
export function runWithActionButtonLock(
  action: (() => PromiseLike<unknown> | void | undefined) | undefined
): void {
  if (action === undefined) {
    return;
  }

  const chatStore = useChatStore.getState();

  if (chatStore.isActionLocked || chatStore.isLoading) {
    return;
  }

  chatStore.lockActions();
  clearActionButtonLockTimer();
  actionButtonLockId += 1;
  const lockId = actionButtonLockId;
  const lockedAt = getActionButtonLockTimestamp();
  activeActionButtonLockId = lockId;

  let result: PromiseLike<unknown> | void | undefined;

  try {
    result = action?.();
  } catch (error) {
    releaseActionButtonLockAfterMinimumDelay(lockId, lockedAt);
    throw error;
  }

  if (isPromiseLike(result)) {
    void Promise.resolve(result).finally(() => {
      releaseActionButtonLockAfterMinimumDelay(lockId, lockedAt);
    });
    return;
  }

  releaseActionButtonLockAfterMinimumDelay(lockId, lockedAt);
}
