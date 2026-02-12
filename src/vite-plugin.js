/**
 * Vite plugin for actionable-support-chat that ensures React and React-DOM
 * are properly deduplicated to prevent multiple React instances.
 *
 * This plugin should be added to your Vite configuration to avoid
 * "resolveDispatcher() is null" errors when using the library.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'vite';
 * import react from '@vitejs/plugin-react';
 * import { actionableSupportChatVitePlugin } from 'actionable-support-chat/vite-plugin';
 *
 * export default defineConfig({
 *   plugins: [react(), actionableSupportChatVitePlugin()],
 * });
 * ```
 */
export function actionableSupportChatVitePlugin() {
  return {
    name: 'actionable-support-chat-dedupe',
    config(config) {
      // Ensure React and React-DOM are deduplicated
      const existingResolve = config.resolve ?? {};
      const existingDedupe = existingResolve.dedupe ?? [];

      return {
        resolve: {
          ...existingResolve,
          dedupe: [...new Set([...existingDedupe, 'react', 'react-dom'])],
        },
      };
    },
  };
}
