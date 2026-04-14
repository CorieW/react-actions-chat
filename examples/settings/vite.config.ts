import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { reactActionsChatVitePlugin } from 'react-actions-chat/vite-plugin';
import { settingsRecommendationApiPlugin } from './server/settingsRecommendationApiPlugin';

const EXAMPLE_DIR = fileURLToPath(new URL('.', import.meta.url));

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

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, EXAMPLE_DIR, '');

  return {
    base: normalizeBasePath(process.env.EXAMPLE_BASE_PATH),
    plugins: [
      react(),
      reactActionsChatVitePlugin(),
      settingsRecommendationApiPlugin(env.OPENAI_API_KEY),
    ],
  };
});
