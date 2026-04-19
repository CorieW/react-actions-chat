import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { reactActionsChatVitePlugin } from 'react-actions-chat/vite-plugin';
import { createLlmDemoServerPlugin } from './llmDemoServer';

function normalizeBasePath(rawBasePath?: string): string {
  if (!rawBasePath || rawBasePath === '/') {
    return '/';
  }

  const trimmedBasePath = rawBasePath.trim().replace(/^\/+|\/+$/g, '');

  return trimmedBasePath ? `/${trimmedBasePath}/` : '/';
}

// https://vite.dev/config/
export default defineConfig({
  base: normalizeBasePath(process.env.EXAMPLE_BASE_PATH),
  plugins: [react(), reactActionsChatVitePlugin(), createLlmDemoServerPlugin()],
});
