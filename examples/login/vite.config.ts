import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { reactActionsChatVitePlugin } from 'react-actions-chat/vite-plugin';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), reactActionsChatVitePlugin()],
});
