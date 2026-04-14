import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { reactActionsChatVitePlugin } from 'react-actions-chat/vite-plugin';
import { settingsRecommendationApiPlugin } from './server/settingsRecommendationApiPlugin';

const EXAMPLE_DIR = fileURLToPath(new URL('.', import.meta.url));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, EXAMPLE_DIR, '');

  return {
    plugins: [
      react(),
      reactActionsChatVitePlugin(),
      settingsRecommendationApiPlugin(env.OPENAI_API_KEY),
    ],
  };
});
