import type { MaybePromise } from '../supportFlowTypes';

/**
 * Returns whether promise like.
 *
 * @param value - Value to inspect or resolve.
 */
export function isPromiseLike<T>(value: MaybePromise<T>): value is Promise<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof value.then === 'function'
  );
}
