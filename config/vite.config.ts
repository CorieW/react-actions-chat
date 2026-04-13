import { resolve } from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  root: resolve(__dirname, '..'),
  resolve: {
    alias: [
      {
        find: 'actionable-support-chat/components',
        replacement: resolve(__dirname, '..', 'src/components/index.ts'),
      },
      {
        find: 'actionable-support-chat/lib',
        replacement: resolve(__dirname, '..', 'src/lib/index.ts'),
      },
      {
        find: 'actionable-support-chat/types',
        replacement: resolve(__dirname, '..', 'src/js/types.ts'),
      },
      {
        find: 'actionable-support-chat-recommended-actions/embedders',
        replacement: resolve(
          __dirname,
          '..',
          'packages/actionable-support-chat-recommended-actions/src/embedders/index.ts'
        ),
      },
      {
        find: 'actionable-support-chat-recommended-actions',
        replacement: resolve(
          __dirname,
          '..',
          'packages/actionable-support-chat-recommended-actions/src/index.ts'
        ),
      },
      {
        find: 'actionable-support-chat',
        replacement: resolve(__dirname, '..', 'src/index.ts'),
      },
    ],
  },
  plugins: [react(), tailwindcss()],
  build: {
    lib: {
      entry: resolve(__dirname, '..', 'src/index.ts'),
      name: 'ActionableSupportChat',
      formats: ['es', 'cjs'],
      fileName: format => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'react/jsx-runtime',
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: resolve(__dirname, '..', 'src/__tests__/setup.ts'),
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}', 'packages/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/__tests__/**',
        'packages/**/*.test.{ts,tsx}',
        'packages/**/__tests__/**',
        'src/test/**',
        'src/main.tsx',
        'src/App.tsx',
        'src/**/*.d.ts',
        'src/**/types.ts',
        'src/components/ui/**', // UI components from shadcn
        'src/components/RequestConfirmationButton.tsx', // Helper utilities
        'src/components/RequestInputButton.tsx', // Helper utilities
        'packages/**/index.ts',
      ],
      all: true,
    },
  },
});
