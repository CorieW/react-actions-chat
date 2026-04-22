import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { reactActionsChatVitePlugin } from 'react-actions-chat/vite-plugin';

/**
 * Keeps the example base path safe for local development and static hosting.
 */
function normalizeBasePath(rawBasePath?: string): string {
  if (!rawBasePath || rawBasePath === '/') {
    return '/';
  }

  const trimmedBasePath = rawBasePath.trim().replace(/^\/+|\/+$/g, '');

  return trimmedBasePath ? `/${trimmedBasePath}/` : '/';
}

export default defineConfig({
  base: normalizeBasePath(process.env.EXAMPLE_BASE_PATH),
  plugins: [react(), reactActionsChatVitePlugin()],
});
