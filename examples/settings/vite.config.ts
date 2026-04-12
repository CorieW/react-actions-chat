import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { actionableSupportChatVitePlugin } from 'actionable-support-chat/vite-plugin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), actionableSupportChatVitePlugin()],
});
