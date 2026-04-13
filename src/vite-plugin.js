/**
 * Vite plugin for react-actions-chat that ensures React and React-DOM
 * are properly deduplicated to prevent multiple React instances.
 *
 * This plugin should be added to your Vite configuration to avoid
 * "resolveDispatcher() is null" errors when using the library.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'vite';
 * import react from '@vitejs/plugin-react';
 * import { reactActionsChatVitePlugin } from 'react-actions-chat/vite-plugin';
 *
 * export default defineConfig({
 *   plugins: [react(), reactActionsChatVitePlugin()],
 * });
 * ```
 */
export function reactActionsChatVitePlugin() {
  return {
    name: 'react-actions-chat-dedupe',
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
