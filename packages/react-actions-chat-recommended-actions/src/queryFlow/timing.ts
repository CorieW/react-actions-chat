/**
 * Waits for a fixed number of milliseconds.
 *
 * @param durationMs - Duration to wait, in milliseconds.
 */
export function wait(durationMs: number): Promise<void> {
  return new Promise(resolve => {
    globalThis.setTimeout(resolve, durationMs);
  });
}
